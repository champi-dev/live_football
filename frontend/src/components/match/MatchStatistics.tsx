import { Team, MatchStatistics as Stats } from '../../types';

interface MatchStatisticsProps {
  homeTeam: Team;
  awayTeam: Team;
  statistics?: Stats;
}

export default function MatchStatistics({
  homeTeam,
  awayTeam,
  statistics,
}: MatchStatisticsProps) {
  if (!statistics) {
    return (
      <div className="card p-6">
        <h3 className="text-xl font-heading font-semibold mb-4">Match Statistics</h3>
        <div className="text-center py-8 text-slate-400">
          <div className="text-4xl mb-2">📊</div>
          <p>Statistics not available yet</p>
          <p className="text-xs mt-1">Available during and after the match</p>
        </div>
      </div>
    );
  }

  // Stat row component
  const StatRow = ({
    label,
    homeValue,
    awayValue,
    isPercentage = false,
  }: {
    label: string;
    homeValue?: number;
    awayValue?: number;
    isPercentage?: boolean;
  }) => {
    if (homeValue === null && awayValue === null) return null;

    const home = homeValue || 0;
    const away = awayValue || 0;
    const total = home + away;
    const homePercent = total > 0 ? (home / total) * 100 : 50;
    const awayPercent = total > 0 ? (away / total) * 100 : 50;

    return (
      <div className="mb-4">
        {/* Label and values */}
        <div className="flex items-center justify-between mb-2 text-sm">
          <span className="font-medium">{home}{isPercentage && '%'}</span>
          <span className="text-slate-400">{label}</span>
          <span className="font-medium">{away}{isPercentage && '%'}</span>
        </div>

        {/* Comparison bar */}
        <div className="flex items-center gap-1 h-3 rounded-full overflow-hidden bg-slate-700">
          {/* Home team bar */}
          <div
            className="h-full bg-gradient-to-r from-primary-500 to-primary-400 transition-all duration-500"
            style={{ width: `${homePercent}%` }}
          />
          {/* Away team bar */}
          <div
            className="h-full bg-gradient-to-l from-amber-500 to-amber-400 transition-all duration-500"
            style={{ width: `${awayPercent}%` }}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="card p-6">
      <h3 className="text-xl font-heading font-semibold mb-6">Match Statistics</h3>

      {/* Team headers */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          {homeTeam.logoUrl && (
            <img
              src={homeTeam.logoUrl}
              alt={homeTeam.name}
              className="w-6 h-6 object-contain"
            />
          )}
          <span className="text-sm font-medium">{homeTeam.name}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{awayTeam.name}</span>
          {awayTeam.logoUrl && (
            <img
              src={awayTeam.logoUrl}
              alt={awayTeam.name}
              className="w-6 h-6 object-contain"
            />
          )}
        </div>
      </div>

      {/* Statistics */}
      <div>
        <StatRow
          label="Possession"
          homeValue={statistics.homePossession}
          awayValue={statistics.awayPossession}
          isPercentage
        />

        <StatRow
          label="Shots"
          homeValue={statistics.homeShotsTotal}
          awayValue={statistics.awayShotsTotal}
        />

        <StatRow
          label="Shots on Target"
          homeValue={statistics.homeShotsOnTarget}
          awayValue={statistics.awayShotsOnTarget}
        />

        <StatRow
          label="Shots off Target"
          homeValue={statistics.homeShotsOffTarget}
          awayValue={statistics.awayShotsOffTarget}
        />

        <StatRow
          label="Corners"
          homeValue={statistics.homeCornerKicks}
          awayValue={statistics.awayCornerKicks}
        />

        <StatRow
          label="Fouls"
          homeValue={statistics.homeFouls}
          awayValue={statistics.awayFouls}
        />

        <StatRow
          label="Offsides"
          homeValue={statistics.homeOffsides}
          awayValue={statistics.awayOffsides}
        />

        <StatRow
          label="Yellow Cards"
          homeValue={statistics.homeYellowCards}
          awayValue={statistics.awayYellowCards}
        />

        {(statistics.homeRedCards || statistics.awayRedCards) ? (
          <StatRow
            label="Red Cards"
            homeValue={statistics.homeRedCards}
            awayValue={statistics.awayRedCards}
          />
        ) : null}

        <StatRow
          label="Saves"
          homeValue={statistics.homeSaves}
          awayValue={statistics.awaySaves}
        />
      </div>
    </div>
  );
}
