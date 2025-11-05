import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useMatches } from '../hooks/useMatches';
import type { Match } from '../types';

export default function Home() {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuthStore();

  // Filters
  const [search, setSearch] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const limit = 12;

  // Use React Query hook with automatic caching and background refresh
  const { data, isLoading, isFetching } = useMatches({
    page,
    limit,
    date,
    search: search || undefined,
    status: status || undefined,
  });

  const matches = data?.matches || [];
  const pagination = data?.pagination || { page: 1, limit, total: 0, totalPages: 0 };

  const handleMatchClick = (matchId: number) => {
    navigate(`/matches/${matchId}`);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      LIVE: { label: 'LIVE', className: 'bg-primary-500 text-white' },
      HT: { label: 'HT', className: 'bg-amber-500 text-white' },
      FT: { label: 'FT', className: 'bg-slate-600 text-white' },
      NS: { label: 'Upcoming', className: 'bg-slate-700 text-slate-300' },
    };

    const config = statusConfig[status] || { label: status, className: 'bg-slate-700 text-slate-300' };

    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${config.className}`}>
        {config.label}
      </span>
    );
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-surface border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-heading font-bold text-gradient">
              ⚽ LiveFootball Insights
            </h1>
            <div className="flex items-center gap-4">
              {isAuthenticated ? (
                <>
                  <span className="text-sm text-slate-300">
                    Welcome, {user?.name}
                  </span>
                  <button
                    onClick={logout}
                    className="btn-outline"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="btn-outline">
                    Login
                  </Link>
                  <Link to="/register" className="btn-primary">
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Filters */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search teams or leagues..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1); // Reset to first page on search
                }}
                className="w-full px-4 py-2 bg-surface border border-slate-700 rounded-lg focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition-colors"
              />
            </div>

            {/* Date Picker */}
            <div>
              <input
                type="date"
                value={date}
                onChange={(e) => {
                  setDate(e.target.value);
                  setPage(1);
                }}
                className="px-4 py-2 bg-surface border border-slate-700 rounded-lg focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition-colors"
              />
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setPage(1);
                }}
                className="px-4 py-2 bg-surface border border-slate-700 rounded-lg focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition-colors"
              >
                <option value="">All Matches</option>
                <option value="NS">Upcoming</option>
                <option value="LIVE">Live</option>
                <option value="FT">Finished</option>
              </select>
            </div>

            {/* Live Indicator */}
            {isFetching && (
              <div className="flex items-center gap-2 px-4 py-2 bg-primary-500/10 border border-primary-500/30 rounded-lg">
                <div className="w-2 h-2 bg-primary-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-primary-400">Updating...</span>
              </div>
            )}
          </div>

          {/* Results Count & Auto-refresh Info */}
          <div className="flex items-center justify-between text-sm text-slate-400">
            <div className="flex items-center gap-4">
              <span>
                {isLoading ? 'Loading...' : `${pagination.total} match${pagination.total !== 1 ? 'es' : ''} found`}
              </span>
              {(status === 'LIVE' || date === new Date().toISOString().split('T')[0]) && !isLoading && (
                <span className="text-xs text-primary-400 flex items-center gap-1">
                  <div className="w-1.5 h-1.5 bg-primary-500 rounded-full animate-pulse"></div>
                  Auto-updating every 30s
                </span>
              )}
            </div>
            {pagination.totalPages > 1 && (
              <span>
                Page {pagination.page} of {pagination.totalPages}
              </span>
            )}
          </div>
        </div>

        {/* Matches Grid */}
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="card p-6 animate-pulse">
                <div className="h-6 bg-slate-700 rounded w-1/2 mb-4"></div>
                <div className="h-4 bg-slate-700 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        ) : matches.length > 0 ? (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {matches.map((match) => (
                <div
                  key={match.id}
                  onClick={() => handleMatchClick(match.id)}
                  className="card p-6 cursor-pointer hover:border-primary-500 transition-all duration-200 hover:shadow-lg hover:shadow-primary-500/20"
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-slate-400 truncate">
                      {match.leagueName}
                    </span>
                    {getStatusBadge(match.status)}
                  </div>

                  <div className="space-y-3">
                    {/* Home Team */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        {match.homeTeam.logoUrl && (
                          <img
                            src={match.homeTeam.logoUrl}
                            alt={match.homeTeam.name}
                            className="w-8 h-8 object-contain"
                          />
                        )}
                        <span className="font-semibold truncate">
                          {match.homeTeam.name}
                        </span>
                      </div>
                      <span className="text-2xl font-bold ml-2">
                        {match.homeScore}
                      </span>
                    </div>

                    {/* Away Team */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        {match.awayTeam.logoUrl && (
                          <img
                            src={match.awayTeam.logoUrl}
                            alt={match.awayTeam.name}
                            className="w-8 h-8 object-contain"
                          />
                        )}
                        <span className="font-semibold truncate">
                          {match.awayTeam.name}
                        </span>
                      </div>
                      <span className="text-2xl font-bold ml-2">
                        {match.awayScore}
                      </span>
                    </div>
                  </div>

                  {/* Match Time/Elapsed */}
                  <div className="mt-4 pt-4 border-t border-slate-700 text-sm text-slate-400 text-center">
                    {match.status === 'LIVE' && match.elapsedTime ? (
                      <span className="text-primary-500 font-medium">
                        {match.elapsedTime}' - In Progress
                      </span>
                    ) : (
                      <span>
                        {new Date(match.matchDate).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={pagination.page === 1}
                  className="px-4 py-2 bg-surface border border-slate-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:border-primary-500 transition-colors"
                >
                  ← Previous
                </button>

                <div className="flex gap-1">
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    const pageNumber = i + 1;
                    return (
                      <button
                        key={pageNumber}
                        onClick={() => setPage(pageNumber)}
                        className={`px-4 py-2 rounded-lg transition-colors ${
                          pagination.page === pageNumber
                            ? 'bg-primary-500 text-white'
                            : 'bg-surface border border-slate-700 hover:border-primary-500'
                        }`}
                      >
                        {pageNumber}
                      </button>
                    );
                  })}
                  {pagination.totalPages > 5 && (
                    <>
                      <span className="px-2 py-2">...</span>
                      <button
                        onClick={() => setPage(pagination.totalPages)}
                        className={`px-4 py-2 rounded-lg transition-colors ${
                          pagination.page === pagination.totalPages
                            ? 'bg-primary-500 text-white'
                            : 'bg-surface border border-slate-700 hover:border-primary-500'
                        }`}
                      >
                        {pagination.totalPages}
                      </button>
                    </>
                  )}
                </div>

                <button
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                  disabled={pagination.page === pagination.totalPages}
                  className="px-4 py-2 bg-surface border border-slate-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:border-primary-500 transition-colors"
                >
                  Next →
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="card p-12 text-center">
            <div className="text-6xl mb-4">⚽</div>
            <h3 className="text-xl font-semibold mb-2">No matches found</h3>
            <p className="text-slate-400">
              Try adjusting your filters or selecting a different date
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
