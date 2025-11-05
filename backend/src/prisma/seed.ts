import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Major leagues configuration (these IDs correspond to API-FOOTBALL league IDs)
const majorLeagues = [
  { id: 39, name: 'Premier League', country: 'England' },
  { id: 140, name: 'La Liga', country: 'Spain' },
  { id: 135, name: 'Serie A', country: 'Italy' },
  { id: 78, name: 'Bundesliga', country: 'Germany' },
  { id: 61, name: 'Ligue 1', country: 'France' },
  { id: 2, name: 'UEFA Champions League', country: 'Europe' },
  { id: 3, name: 'UEFA Europa League', country: 'Europe' },
  { id: 1, name: 'FIFA World Cup', country: 'World' },
  { id: 4, name: 'UEFA European Championship', country: 'Europe' },
  { id: 9, name: 'Copa America', country: 'South America' },
  { id: 45, name: 'FA Cup', country: 'England' },
  { id: 143, name: 'Copa del Rey', country: 'Spain' },
];

async function main() {
  console.log('🌱 Seeding database...');

  // Note: Teams will be populated dynamically from API-FOOTBALL when matches are fetched
  // This seed file is mainly for reference

  console.log('✅ Database seeded successfully');
  console.log(`📋 Major leagues configured: ${majorLeagues.length} leagues`);
  console.log('ℹ️  Teams will be populated automatically when fetching match data');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

export { majorLeagues };
