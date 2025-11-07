import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useMatch } from '../hooks/useMatches';
import type { AIInsight } from '../types';
import LoadingSpinner from '../components/shared/LoadingSpinner';
import Button from '../components/ui/Button';
import MatchLineups from '../components/match/MatchLineups';
import MatchStatistics from '../components/match/MatchStatistics';
import {
  formatDateTime,
  formatElapsedTime,
  getEventIcon,
  isMatchLive,
  isMatchFinished,
} from '../utils/formatters';
import { matchesAPI } from '../services/api';
import toast from 'react-hot-toast';
import { ArrowLeft, Sparkles } from 'lucide-react';

export default function MatchDetail() {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated } = useAuthStore();
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [generatingInsight, setGeneratingInsight] = useState(false);

  // Use React Query hook with auto-refresh (20s for live, 5min for others)
  const { data: match, isLoading } = useMatch(parseInt(id!));

  // Fetch insights when component mounts
  useEffect(() => {
    if (id) {
      fetchInsights();
    }
  }, [id]);

  const fetchInsights = async () => {
    try {
      const data = await matchesAPI.getMatchInsights(parseInt(id!));
      setInsights(data);
    } catch (error) {
      console.error('Failed to fetch insights:', error);
    }
  };

  const generateInsight = async (type: 'pre_match' | 'live_update' | 'halftime' | 'post_match', deepAnalysis = false) => {
    if (!isAuthenticated) {
      toast.error('Please login to generate AI insights');
      return;
    }

    try {
      setGeneratingInsight(true);
      const insight = await matchesAPI.generateInsight(parseInt(id!), type, deepAnalysis);
      setInsights((prev) => [insight, ...prev]);
      await fetchInsights(); // Refresh insights list
      toast.success('AI insight generated!');
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to generate insight';

      // Show user-friendly error messages
      if (error.response?.status === 503) {
        toast.error(errorMessage, { duration: 6000 });
      } else {
        toast.error(errorMessage);
      }

      console.error('Failed to generate insight:', error);
    } finally {
      setGeneratingInsight(false);
    }
  };

  if (isLoading || !match) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const getStatusBadge = () => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      LIVE: { label: 'LIVE', className: 'bg-primary-500 text-white' },
      HT: { label: 'HT', className: 'bg-amber-500 text-white' },
      FT: { label: 'FT', className: 'bg-slate-600 text-white' },
      NS: { label: 'Upcoming', className: 'bg-slate-700 text-slate-300' },
    };

    const config = statusConfig[match.status] || { label: match.status, className: 'bg-slate-700 text-slate-300' };

    return (
      <span className={`px-3 py-1.5 rounded-lg text-sm font-medium ${config.className}`}>
        {isMatchLive(match.status) && (
          <span className="inline-block w-2 h-2 bg-white rounded-full animate-pulse mr-2"></span>
        )}
        {config.label}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-surface border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <Link to="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-100">
            <ArrowLeft className="w-4 h-4" />
            Back to matches
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Match Header */}
        <div className="card p-8 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="text-sm text-slate-400">{match.leagueName}</div>
            {getStatusBadge()}
          </div>

          <div className="flex items-center justify-between gap-8">
            {/* Home Team */}
            <div className="flex-1 text-center">
              {match.homeTeam.logoUrl && (
                <img
                  src={match.homeTeam.logoUrl}
                  alt={match.homeTeam.name}
                  className="w-20 h-20 mx-auto mb-4 object-contain"
                  onError={(e) => (e.currentTarget.style.display = 'none')}
                />
              )}
              <h2 className="text-2xl font-heading font-bold">{match.homeTeam.name}</h2>
            </div>

            {/* Score */}
            <div className="text-center px-8">
              <div className="text-6xl font-bold tabular-nums">
                {match.homeScore} - {match.awayScore}
              </div>
              {isMatchLive(match.status) && match.elapsedTime && (
                <div className="text-lg text-primary-500 mt-2 font-medium">
                  {formatElapsedTime(match.elapsedTime)}
                </div>
              )}
              {match.status === 'NS' && (
                <div className="text-sm text-slate-400 mt-2">{formatDateTime(match.matchDate)}</div>
              )}
            </div>

            {/* Away Team */}
            <div className="flex-1 text-center">
              {match.awayTeam.logoUrl && (
                <img
                  src={match.awayTeam.logoUrl}
                  alt={match.awayTeam.name}
                  className="w-20 h-20 mx-auto mb-4 object-contain"
                  onError={(e) => (e.currentTarget.style.display = 'none')}
                />
              )}
              <h2 className="text-2xl font-heading font-bold">{match.awayTeam.name}</h2>
            </div>
          </div>

          {/* Match Info Footer */}
          <div className="mt-6 pt-6 border-t border-slate-700">
            <div className="flex flex-wrap gap-4 justify-center text-sm text-slate-400">
              {match.venue && (
                <span className="inline-flex items-center gap-1">
                  📍 {match.venue}
                </span>
              )}
              {match.referee && (
                <span className="inline-flex items-center gap-1">
                  👨‍⚖️ {match.referee}
                </span>
              )}
              {match.attendance && (
                <span className="inline-flex items-center gap-1">
                  👥 {match.attendance.toLocaleString()} attendance
                </span>
              )}
            </div>

            {/* Coaches */}
            {(match.homeCoach || match.awayCoach) && (
              <div className="flex items-center justify-between mt-4 text-xs text-slate-500">
                {match.homeCoach && <span>Coach: {match.homeCoach}</span>}
                {match.awayCoach && <span>Coach: {match.awayCoach}</span>}
              </div>
            )}

            {/* Half Time Score */}
            {(match.halfTimeHomeScore !== null || match.halfTimeAwayScore !== null) && (
              <div className="mt-4 text-center text-sm text-slate-400">
                Half Time: {match.halfTimeHomeScore} - {match.halfTimeAwayScore}
              </div>
            )}
          </div>
        </div>

        {/* Match Statistics */}
        {match.matchStatistics && (
          <div className="mb-6">
            <MatchStatistics
              homeTeam={match.homeTeam}
              awayTeam={match.awayTeam}
              statistics={match.matchStatistics}
            />
          </div>
        )}

        {/* Team Lineups */}
        {match.matchLineups && match.matchLineups.length > 0 && (
          <div className="mb-6">
            <MatchLineups
              homeTeam={match.homeTeam}
              awayTeam={match.awayTeam}
              homeFormation={match.homeFormation}
              awayFormation={match.awayFormation}
              lineups={match.matchLineups}
            />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Match Events */}
          <div className="lg:col-span-2">
            <div className="card p-6">
              <h3 className="text-xl font-heading font-semibold mb-4">Match Events</h3>

              {match.matchEvents && match.matchEvents.length > 0 ? (
                <div className="space-y-3">
                  {match.matchEvents.map((event) => (
                    <div
                      key={event.id}
                      className="flex items-start gap-3 p-3 rounded-lg bg-background/50 border border-slate-700/50"
                    >
                      <div className="text-2xl">{getEventIcon(event.eventType)}</div>
                      <div className="flex-1">
                        <div className="font-medium">{event.playerName || 'Unknown Player'}</div>
                        {event.assistName && event.eventType === 'Goal' && (
                          <div className="text-xs text-slate-400">
                            Assist: {event.assistName}
                          </div>
                        )}
                        {event.assistName && event.eventType === 'Substitution' && (
                          <div className="text-xs text-slate-400">
                            Out: {event.assistName}
                          </div>
                        )}
                        <div className="text-sm text-slate-400">
                          {event.eventType} • {event.minute}'{event.injuryTime ? `+${event.injuryTime}` : ''}
                        </div>
                        {event.detail && <div className="text-xs text-slate-500 mt-1">{event.detail}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-400">
                  <div className="text-4xl mb-2">⚽</div>
                  <p>No events yet</p>
                </div>
              )}
            </div>
          </div>

          {/* AI Insights */}
          <div className="lg:col-span-1">
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-heading font-semibold flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary-500" />
                  AI Insights
                </h3>
              </div>

              {/* Generate Insights Buttons */}
              <div className="space-y-2 mb-6">
                {match.status === 'NS' && (
                  <Button
                    onClick={() => generateInsight('pre_match')}
                    disabled={generatingInsight || !isAuthenticated}
                    className="w-full"
                    size="sm"
                  >
                    Generate Pre-Match Analysis
                  </Button>
                )}

                {isMatchLive(match.status) && (
                  <Button
                    onClick={() => generateInsight('live_update')}
                    disabled={generatingInsight || !isAuthenticated}
                    className="w-full"
                    size="sm"
                  >
                    Generate Live Match Update
                  </Button>
                )}

                {match.status === 'HT' && (
                  <Button
                    onClick={() => generateInsight('halftime')}
                    disabled={generatingInsight || !isAuthenticated}
                    className="w-full"
                    size="sm"
                  >
                    Generate Halftime Analysis
                  </Button>
                )}

                {isMatchFinished(match.status) && (
                  <>
                    <Button
                      onClick={() => generateInsight('post_match')}
                      disabled={generatingInsight || !isAuthenticated}
                      className="w-full"
                      size="sm"
                    >
                      Generate Post-Match Analysis
                    </Button>
                    <Button
                      onClick={() => generateInsight('post_match', true)}
                      disabled={generatingInsight || !isAuthenticated}
                      variant="secondary"
                      className="w-full"
                      size="sm"
                    >
                      Deep Analysis
                    </Button>
                  </>
                )}
              </div>

              {!isAuthenticated && (
                <div className="text-sm text-slate-400 mb-4 p-3 bg-background rounded-lg border border-slate-700">
                  <Link to="/login" className="text-primary-500 hover:underline">
                    Login
                  </Link>{' '}
                  to generate AI insights
                </div>
              )}

              {generatingInsight && (
                <div className="flex items-center justify-center gap-2 p-4 bg-background rounded-lg border border-slate-700">
                  <LoadingSpinner size="sm" />
                  <span className="text-sm text-slate-400">Generating insight...</span>
                </div>
              )}

              {/* Insights List */}
              {insights.length > 0 ? (
                <div className="space-y-4">
                  {insights.map((insight) => (
                    <div
                      key={insight.id}
                      className="p-4 bg-background rounded-lg border border-slate-700"
                    >
                      <div className="text-xs text-slate-500 mb-2">
                        {insight.insightType.replace('_', ' ').toUpperCase()}
                      </div>
                      <p className="text-sm text-slate-300 whitespace-pre-wrap">{insight.content}</p>
                      {insight.tokensUsed && (
                        <div className="text-xs text-slate-500 mt-2">
                          {insight.tokensUsed} tokens used
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-400">
                  <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No insights yet</p>
                  <p className="text-xs mt-1">Generate one above!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
