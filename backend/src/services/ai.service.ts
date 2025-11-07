import OpenAI from 'openai';
import { prisma } from '../config/database';
import { InsightType } from '@prisma/client';
import { logger } from '../utils/logger';
import { CacheService, CacheKeys } from '../utils/cache';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export class AIService {
  /**
   * Generate pre-match analysis
   */
  static async generatePreMatchInsight(match: any) {
    try {
      const cacheKey = CacheKeys.aiInsight(match.id, 'pre_match');
      const cached = await CacheService.get(cacheKey);
      if (cached) {
        return cached;
      }

      const prompt = `Analyze the upcoming match between ${match.homeTeam.name} and ${match.awayTeam.name} in ${match.leagueName}.

Match Details:
- Date: ${new Date(match.matchDate).toLocaleDateString()}
- Venue: ${match.venue || 'Unknown'}

Please provide:
1. Brief team form analysis
2. Key players to watch
3. Tactical approach prediction
4. Match prediction with confidence level

Keep the analysis under 200 words and engaging for soccer fans.`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert soccer analyst providing insightful match predictions and analysis.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 300,
        temperature: 0.7,
      });

      const content = completion.choices[0].message.content || '';
      const tokensUsed = completion.usage?.total_tokens || 0;

      // Save to database
      const insight = await prisma.aIInsight.create({
        data: {
          matchId: match.id,
          insightType: InsightType.pre_match,
          content,
          tokensUsed,
        },
      });

      // Cache for 2 hours
      await CacheService.set(cacheKey, insight, 7200);

      return insight;
    } catch (error) {
      logger.error('Error generating pre-match insight:', error);
      throw error;
    }
  }

  /**
   * Generate live event commentary
   */
  static async generateLiveEventInsight(match: any, event: any) {
    try {
      const prompt = `Provide quick tactical insight on this event: ${event.eventType} ${event.playerName ? `by ${event.playerName}` : ''} at ${event.minute}' in ${match.homeTeam.name} vs ${match.awayTeam.name} match.

Current score: ${match.homeScore} - ${match.awayScore}

Keep it under 50 words, punchy and insightful.`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a live soccer commentator providing tactical insights on match events.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 80,
        temperature: 0.8,
      });

      const content = completion.choices[0].message.content || '';
      const tokensUsed = completion.usage?.total_tokens || 0;

      // Save to database
      const insight = await prisma.aIInsight.create({
        data: {
          matchId: match.id,
          insightType: InsightType.live_update,
          content,
          generatedAtMinute: event.minute,
          tokensUsed,
        },
      });

      return insight;
    } catch (error) {
      logger.error('Error generating live event insight:', error);
      throw error;
    }
  }

  /**
   * Generate live match update (for ongoing matches)
   */
  static async generateLiveMatchInsight(match: any, events: any[]) {
    try {
      const cacheKey = CacheKeys.aiInsight(match.id, 'live_update');
      const cached = await CacheService.get(cacheKey);
      if (cached) {
        return cached;
      }

      const eventsSummary = events
        .map((e) => `${e.minute}' - ${e.eventType}: ${e.playerName || 'Unknown'}`)
        .join('\n');

      const prompt = `Provide a live match update for ${match.homeTeam.name} ${match.homeScore} - ${match.awayScore} ${match.awayTeam.name}.

Current minute: ${match.elapsedTime || 'Unknown'}
Match events so far:
${eventsSummary || 'No events yet'}

Analyze the current flow of the game, key moments, and what to watch for. Keep under 150 words.`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a soccer analyst providing live match commentary and analysis.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 250,
        temperature: 0.7,
      });

      const content = completion.choices[0].message.content || '';
      const tokensUsed = completion.usage?.total_tokens || 0;

      // Save to database
      const insight = await prisma.aIInsight.create({
        data: {
          matchId: match.id,
          insightType: InsightType.live_update,
          content,
          generatedAtMinute: match.elapsedTime,
          tokensUsed,
        },
      });

      // Cache for 2 minutes (live data changes quickly)
      await CacheService.set(cacheKey, insight, 120);

      return insight;
    } catch (error) {
      logger.error('Error generating live match insight:', error);
      throw error;
    }
  }

  /**
   * Generate halftime analysis
   */
  static async generateHalftimeInsight(match: any, firstHalfEvents: any[]) {
    try {
      const cacheKey = CacheKeys.aiInsight(match.id, 'halftime');
      const cached = await CacheService.get(cacheKey);
      if (cached) {
        return cached;
      }

      const eventsSummary = firstHalfEvents
        .map((e) => `${e.minute}' - ${e.eventType}: ${e.playerName || 'Unknown'}`)
        .join('\n');

      const prompt = `Provide halftime analysis for ${match.homeTeam.name} ${match.homeScore} - ${match.awayScore} ${match.awayTeam.name}.

First half events:
${eventsSummary}

What should teams adjust in the second half? Keep under 150 words.`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a soccer analyst providing halftime tactical analysis.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 250,
        temperature: 0.7,
      });

      const content = completion.choices[0].message.content || '';
      const tokensUsed = completion.usage?.total_tokens || 0;

      // Save to database
      const insight = await prisma.aIInsight.create({
        data: {
          matchId: match.id,
          insightType: InsightType.halftime,
          content,
          generatedAtMinute: 45,
          tokensUsed,
        },
      });

      // Cache for 5 minutes
      await CacheService.set(cacheKey, insight, 300);

      return insight;
    } catch (error) {
      logger.error('Error generating halftime insight:', error);
      throw error;
    }
  }

  /**
   * Generate post-match analysis
   */
  static async generatePostMatchInsight(match: any, events: any[]) {
    try {
      const cacheKey = CacheKeys.aiInsight(match.id, 'post_match');
      const cached = await CacheService.get(cacheKey);
      if (cached) {
        return cached;
      }

      const eventsSummary = events
        .map((e) => `${e.minute}' - ${e.eventType}: ${e.playerName || 'Unknown'}`)
        .join('\n');

      const prompt = `Provide post-match analysis for ${match.homeTeam.name} ${match.homeScore} - ${match.awayScore} ${match.awayTeam.name}.

Key events:
${eventsSummary}

Provide:
1. Match summary
2. Key moments analysis
3. Man of the match suggestion
4. Impact on league standings (if applicable)

Keep it engaging and under 200 words.`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a soccer analyst providing comprehensive post-match analysis.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 300,
        temperature: 0.7,
      });

      const content = completion.choices[0].message.content || '';
      const tokensUsed = completion.usage?.total_tokens || 0;

      // Save to database
      const insight = await prisma.aIInsight.create({
        data: {
          matchId: match.id,
          insightType: InsightType.post_match,
          content,
          tokensUsed,
        },
      });

      // Cache permanently
      await CacheService.set(cacheKey, insight, 86400);

      return insight;
    } catch (error) {
      logger.error('Error generating post-match insight:', error);
      throw error;
    }
  }

  /**
   * Generate deep analysis with web search (future enhancement)
   */
  static async generateDeepAnalysis(match: any) {
    try {
      // This would use web search capabilities
      // For now, we'll create a more detailed analysis
      const prompt = `Perform comprehensive analysis of ${match.homeTeam.name} vs ${match.awayTeam.name}.

Provide detailed sections on:
1. Team Form Analysis - Recent performance trends
2. Tactical Breakdown - Expected formations and key matchups
3. Key Player Analysis - Players who could decide the match
4. Historical Head-to-Head - Recent meetings between these teams
5. Prediction with detailed reasoning

Make it comprehensive and engaging, around 400-500 words.`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert soccer analyst with deep tactical knowledge providing premium analysis.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 1000,
        temperature: 0.7,
      });

      const content = completion.choices[0].message.content || '';
      const tokensUsed = completion.usage?.total_tokens || 0;

      // Save to database
      const insight = await prisma.aIInsight.create({
        data: {
          matchId: match.id,
          insightType: InsightType.pre_match,
          content,
          tokensUsed,
        },
      });

      return insight;
    } catch (error) {
      logger.error('Error generating deep analysis:', error);
      throw error;
    }
  }

  /**
   * Get all insights for a match
   */
  static async getMatchInsights(matchId: number) {
    const insights = await prisma.aIInsight.findMany({
      where: { matchId },
      orderBy: { createdAt: 'desc' },
    });

    return insights;
  }
}
