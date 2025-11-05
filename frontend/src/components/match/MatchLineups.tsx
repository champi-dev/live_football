import { Team, MatchLineup } from '../../types';

interface MatchLineupsProps {
  homeTeam: Team;
  awayTeam: Team;
  homeFormation?: string;
  awayFormation?: string;
  lineups?: MatchLineup[];
}

export default function MatchLineups({
  homeTeam,
  awayTeam,
  homeFormation,
  awayFormation,
  lineups,
}: MatchLineupsProps) {
  if (!lineups || lineups.length === 0) {
    return (
      <div className="card p-6">
        <h3 className="text-xl font-heading font-semibold mb-4">Team Lineups</h3>
        <div className="text-center py-8 text-slate-400">
          <div className="text-4xl mb-2">👥</div>
          <p>Lineups not available yet</p>
          <p className="text-xs mt-1">Available once the match starts</p>
        </div>
      </div>
    );
  }

  // Separate lineups by team
  const homeLineup = lineups.filter((p) => p.teamId === homeTeam.id && p.isStarting);
  const homeBench = lineups.filter((p) => p.teamId === homeTeam.id && !p.isStarting);
  const awayLineup = lineups.filter((p) => p.teamId === awayTeam.id && p.isStarting);
  const awayBench = lineups.filter((p) => p.teamId === awayTeam.id && !p.isStarting);

  const PlayerCard = ({ player }: { player: MatchLineup }) => (
    <div className="flex items-center gap-2 p-2 bg-background/50 rounded border border-slate-700/50">
      <div className="w-8 h-8 rounded-full bg-primary-500/20 flex items-center justify-center text-primary-400 font-bold text-sm">
        {player.shirtNumber || '?'}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm truncate">{player.playerName}</div>
        {player.position && (
          <div className="text-xs text-slate-500">{player.position}</div>
        )}
      </div>
    </div>
  );

  return (
    <div className="card p-6">
      <h3 className="text-xl font-heading font-semibold mb-4">Team Lineups</h3>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Home Team */}
        <div>
          <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-700">
            {homeTeam.logoUrl && (
              <img
                src={homeTeam.logoUrl}
                alt={homeTeam.name}
                className="w-8 h-8 object-contain"
              />
            )}
            <div>
              <h4 className="font-semibold">{homeTeam.name}</h4>
              {homeFormation && (
                <p className="text-sm text-slate-400">Formation: {homeFormation}</p>
              )}
            </div>
          </div>

          {/* Starting XI */}
          <div className="mb-4">
            <h5 className="text-sm font-medium text-slate-400 mb-2 uppercase">
              Starting XI
            </h5>
            <div className="space-y-2">
              {homeLineup.map((player) => (
                <PlayerCard key={player.id} player={player} />
              ))}
            </div>
          </div>

          {/* Bench */}
          {homeBench.length > 0 && (
            <div>
              <h5 className="text-sm font-medium text-slate-400 mb-2 uppercase">
                Substitutes
              </h5>
              <div className="space-y-2">
                {homeBench.map((player) => (
                  <PlayerCard key={player.id} player={player} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Away Team */}
        <div>
          <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-700">
            {awayTeam.logoUrl && (
              <img
                src={awayTeam.logoUrl}
                alt={awayTeam.name}
                className="w-8 h-8 object-contain"
              />
            )}
            <div>
              <h4 className="font-semibold">{awayTeam.name}</h4>
              {awayFormation && (
                <p className="text-sm text-slate-400">Formation: {awayFormation}</p>
              )}
            </div>
          </div>

          {/* Starting XI */}
          <div className="mb-4">
            <h5 className="text-sm font-medium text-slate-400 mb-2 uppercase">
              Starting XI
            </h5>
            <div className="space-y-2">
              {awayLineup.map((player) => (
                <PlayerCard key={player.id} player={player} />
              ))}
            </div>
          </div>

          {/* Bench */}
          {awayBench.length > 0 && (
            <div>
              <h5 className="text-sm font-medium text-slate-400 mb-2 uppercase">
                Substitutes
              </h5>
              <div className="space-y-2">
                {awayBench.map((player) => (
                  <PlayerCard key={player.id} player={player} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
