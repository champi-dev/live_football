import { MatchService } from '../src/services/match.service';
import { footballDataService } from '../src/services/football-data.service';
import { logger } from '../src/utils/logger';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function resyncFinishedMatches() {
  try {
    console.log('========================================');
    console.log('Re-syncing finished matches with events');
    console.log('========================================\n');

    // Get all finished matches without events
    const matches = await prisma.match.findMany({
      where: {
        status: 'FT',
      },
      select: {
        id: true,
        homeTeam: { select: { name: true } },
        awayTeam: { select: { name: true } },
        _count: { select: { matchEvents: true } }
      },
      orderBy: { matchDate: 'desc' }
    });

    console.log(`Found ${matches.length} finished matches`);

    const matchesWithoutEvents = matches.filter(m => m._count.matchEvents === 0);
    console.log(`${matchesWithoutEvents.length} matches need event data\n`);

    if (matchesWithoutEvents.length === 0) {
      console.log('✅ All finished matches already have events!');
      process.exit(0);
    }

    let synced = 0;
    let failed = 0;

    for (const match of matchesWithoutEvents) {
      try {
        console.log(`Syncing match ${match.id}: ${match.homeTeam.name} vs ${match.awayTeam.name}...`);

        // Fetch detailed match data from API
        const apiMatch = await footballDataService.getMatchById(match.id);

        // Re-sync the match (this will trigger the event sync logic)
        await MatchService.syncFixture(apiMatch);

        // Check if events were synced
        const eventCount = await prisma.matchEvent.count({
          where: { matchId: match.id }
        });

        console.log(`  ✓ Synced ${eventCount} events`);
        synced++;

        // Rate limiting - wait 2 seconds between requests to respect API limits
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error: any) {
        console.error(`  ✗ Failed: ${error.message}`);
        failed++;

        // If we hit rate limit, wait longer
        if (error.message?.includes('429') || error.message?.includes('rate limit')) {
          console.log('  ⏸ Rate limit hit, waiting 60 seconds...');
          await new Promise(resolve => setTimeout(resolve, 60000));
        }
      }
    }

    console.log('\n========================================');
    console.log('Re-sync complete!');
    console.log(`✓ Successfully synced: ${synced} matches`);
    console.log(`✗ Failed: ${failed} matches`);
    console.log('========================================');

    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error re-syncing matches:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

resyncFinishedMatches();
