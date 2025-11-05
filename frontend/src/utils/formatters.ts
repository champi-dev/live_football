import { format, formatDistanceToNow, isToday, isTomorrow, isPast } from 'date-fns';

/**
 * Format date for display
 */
export const formatDate = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  if (isToday(dateObj)) {
    return 'Today';
  }

  if (isTomorrow(dateObj)) {
    return 'Tomorrow';
  }

  return format(dateObj, 'MMM d, yyyy');
};

/**
 * Format time for display
 */
export const formatTime = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, 'HH:mm');
};

/**
 * Format date and time together
 */
export const formatDateTime = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  if (isToday(dateObj)) {
    return `Today at ${formatTime(dateObj)}`;
  }

  if (isTomorrow(dateObj)) {
    return `Tomorrow at ${formatTime(dateObj)}`;
  }

  return format(dateObj, 'MMM d, yyyy - HH:mm');
};

/**
 * Format relative time (e.g., "2 hours ago")
 */
export const formatRelativeTime = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return formatDistanceToNow(dateObj, { addSuffix: true });
};

/**
 * Format score display
 */
export const formatScore = (homeScore: number, awayScore: number): string => {
  return `${homeScore} - ${awayScore}`;
};

/**
 * Get match status label
 */
export const getMatchStatusLabel = (status: string): string => {
  const statusLabels: Record<string, string> = {
    NS: 'Not Started',
    LIVE: 'Live',
    HT: 'Half Time',
    FT: 'Full Time',
    PST: 'Postponed',
    CANC: 'Cancelled',
    TBD: 'To Be Defined',
  };

  return statusLabels[status] || status;
};

/**
 * Get match status color
 */
export const getMatchStatusColor = (status: string): string => {
  const statusColors: Record<string, string> = {
    NS: 'text-slate-400',
    LIVE: 'text-primary-500',
    HT: 'text-amber-500',
    FT: 'text-slate-400',
    PST: 'text-red-500',
    CANC: 'text-red-500',
    TBD: 'text-slate-400',
  };

  return statusColors[status] || 'text-slate-400';
};

/**
 * Truncate text with ellipsis
 */
export const truncate = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
};

/**
 * Format number with commas
 */
export const formatNumber = (num: number): string => {
  return num.toLocaleString();
};

/**
 * Get team initials (e.g., "Manchester United" -> "MUN")
 */
export const getTeamInitials = (teamName: string): string => {
  const words = teamName.split(' ');

  if (words.length === 1) {
    return teamName.substring(0, 3).toUpperCase();
  }

  return words
    .slice(0, 3)
    .map(word => word[0])
    .join('')
    .toUpperCase();
};

/**
 * Get event icon for match events
 */
export const getEventIcon = (eventType: string): string => {
  const eventIcons: Record<string, string> = {
    Goal: '⚽',
    Card: '🟨',
    Substitution: '🔄',
    VAR: '📺',
  };

  return eventIcons[eventType] || '•';
};

/**
 * Format elapsed time in match
 */
export const formatElapsedTime = (elapsed?: number): string => {
  if (!elapsed) return '';

  if (elapsed > 90) {
    return `90+${elapsed - 90}'`;
  }

  return `${elapsed}'`;
};

/**
 * Check if match is live
 */
export const isMatchLive = (status: string): boolean => {
  return status === 'LIVE' || status === 'HT';
};

/**
 * Check if match has finished
 */
export const isMatchFinished = (status: string): boolean => {
  return status === 'FT';
};

/**
 * Check if match hasn't started
 */
export const isMatchUpcoming = (status: string): boolean => {
  return status === 'NS' || status === 'TBD';
};
