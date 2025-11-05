import { Link } from 'react-router-dom';
import type { Match } from '../../types';
import { formatDateTime, formatElapsedTime, isMatchLive } from '../../utils/formatters';
import { cn } from '../../utils/cn';

interface MatchCardProps {
  match: Match;
  className?: string;
}

export default function MatchCard({ match, className }: MatchCardProps) {
  const getStatusBadge = () => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      LIVE: { label: 'LIVE', className: 'bg-primary-500 text-white' },
      HT: { label: 'HT', className: 'bg-amber-500 text-white' },
      FT: { label: 'FT', className: 'bg-slate-600 text-white' },
      NS: { label: 'Upcoming', className: 'bg-slate-700 text-slate-300' },
      PST: { label: 'Postponed', className: 'bg-red-600 text-white' },
      CANC: { label: 'Cancelled', className: 'bg-red-600 text-white' },
    };

    const config = statusConfig[match.status] || {
      label: match.status,
      className: 'bg-slate-700 text-slate-300'
    };

    return (
      <span className={cn('px-2 py-1 rounded text-xs font-medium', config.className)}>
        {isMatchLive(match.status) && (
          <span className="inline-block w-2 h-2 bg-white rounded-full animate-pulse mr-1"></span>
        )}
        {config.label}
      </span>
    );
  };

  return (
    <Link
      to={`/matches/${match.id}`}
      className={cn('card p-6 block hover:border-primary-500/50 transition-all', className)}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex-1">
          <span className="text-sm text-slate-400">{match.leagueName}</span>
          {match.status === 'NS' && (
            <div className="text-xs text-slate-500 mt-0.5">
              {formatDateTime(match.matchDate)}
            </div>
          )}
        </div>
        {getStatusBadge()}
      </div>

      {/* Teams and Score */}
      <div className="flex items-center justify-between gap-4">
        {/* Home Team */}
        <div className="flex-1 text-right">
          <div className={cn(
            'text-lg font-semibold transition-colors',
            match.homeScore > match.awayScore && match.status === 'FT' && 'text-primary-500'
          )}>
            {match.homeTeam.name}
          </div>
          {match.homeTeam.logoUrl && (
            <img
              src={match.homeTeam.logoUrl}
              alt={match.homeTeam.name}
              className="w-8 h-8 mt-2 ml-auto object-contain"
              onError={(e) => e.currentTarget.style.display = 'none'}
            />
          )}
        </div>

        {/* Score */}
        <div className="text-center px-4">
          <div className="text-3xl font-bold tabular-nums">
            {match.homeScore} - {match.awayScore}
          </div>
          {isMatchLive(match.status) && match.elapsedTime && (
            <div className="text-xs text-primary-500 mt-1 font-medium">
              {formatElapsedTime(match.elapsedTime)}
            </div>
          )}
        </div>

        {/* Away Team */}
        <div className="flex-1">
          <div className={cn(
            'text-lg font-semibold transition-colors',
            match.awayScore > match.homeScore && match.status === 'FT' && 'text-primary-500'
          )}>
            {match.awayTeam.name}
          </div>
          {match.awayTeam.logoUrl && (
            <img
              src={match.awayTeam.logoUrl}
              alt={match.awayTeam.name}
              className="w-8 h-8 mt-2 mr-auto object-contain"
              onError={(e) => e.currentTarget.style.display = 'none'}
            />
          )}
        </div>
      </div>

      {/* Venue */}
      {match.venue && (
        <div className="mt-4 pt-4 border-t border-slate-700 text-sm text-slate-400 flex items-center gap-2">
          <span>📍</span>
          <span>{match.venue}</span>
        </div>
      )}

      {/* Click to view details hint */}
      <div className="mt-3 text-xs text-slate-500 text-center opacity-0 group-hover:opacity-100 transition-opacity">
        Click for details →
      </div>
    </Link>
  );
}
