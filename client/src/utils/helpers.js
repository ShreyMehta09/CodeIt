import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Utility function to merge Tailwind classes
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// Format date for display
export const formatDate = (date, formatStr = 'MMM dd, yyyy') => {
  if (!date) return '';
  return format(new Date(date), formatStr);
};

// Format relative time
export const formatRelativeTime = (date) => {
  if (!date) return '';
  
  const dateObj = new Date(date);
  
  if (isToday(dateObj)) {
    return 'Today';
  }
  
  if (isYesterday(dateObj)) {
    return 'Yesterday';
  }
  
  return formatDistanceToNow(dateObj, { addSuffix: true });
};

// Get difficulty color classes
export const getDifficultyColor = (difficulty) => {
  const colors = {
    easy: 'text-success-600 bg-success-50 border-success-200',
    medium: 'text-warning-600 bg-warning-50 border-warning-200',
    hard: 'text-danger-600 bg-danger-50 border-danger-200',
    beginner: 'text-success-600 bg-success-50 border-success-200',
    regular: 'text-warning-600 bg-warning-50 border-warning-200',
    expert: 'text-danger-600 bg-danger-50 border-danger-200',
    div1: 'text-danger-600 bg-danger-50 border-danger-200',
    div2: 'text-warning-600 bg-warning-50 border-warning-200',
    div3: 'text-success-600 bg-success-50 border-success-200',
  };
  
  return colors[difficulty?.toLowerCase()] || 'text-gray-600 bg-gray-50 border-gray-200';
};

// Get platform color classes
export const getPlatformColor = (platform) => {
  const colors = {
    leetcode: 'text-orange-600 bg-orange-50 border-orange-200',
    codeforces: 'text-blue-600 bg-blue-50 border-blue-200',
    codechef: 'text-amber-600 bg-amber-50 border-amber-200',
    atcoder: 'text-purple-600 bg-purple-50 border-purple-200',
    github: 'text-gray-600 bg-gray-50 border-gray-200',
    custom: 'text-gray-600 bg-gray-50 border-gray-200',
  };
  
  return colors[platform?.toLowerCase()] || 'text-gray-600 bg-gray-50 border-gray-200';
};

// Get status color classes
export const getStatusColor = (status) => {
  const colors = {
    solved: 'text-success-600 bg-success-50 border-success-200',
    attempted: 'text-warning-600 bg-warning-50 border-warning-200',
    todo: 'text-gray-600 bg-gray-50 border-gray-200',
    review: 'text-primary-600 bg-primary-50 border-primary-200',
  };
  
  return colors[status?.toLowerCase()] || 'text-gray-600 bg-gray-50 border-gray-200';
};

// Get priority color classes
export const getPriorityColor = (priority) => {
  const colors = {
    high: 'text-danger-600 bg-danger-50 border-danger-200',
    medium: 'text-warning-600 bg-warning-50 border-warning-200',
    low: 'text-success-600 bg-success-50 border-success-200',
  };
  
  return colors[priority?.toLowerCase()] || 'text-gray-600 bg-gray-50 border-gray-200';
};

// Truncate text
export const truncateText = (text, maxLength = 100) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

// Generate avatar URL or initials
export const getAvatarUrl = (user) => {
  if (user?.avatar) {
    return user.avatar;
  }
  
  // Generate initials
  const name = user?.name || user?.username || 'U';
  const initials = name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
  
  // Generate a simple avatar URL with initials
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=3b82f6&color=ffffff&size=128`;
};

// Calculate progress percentage
export const calculateProgress = (current, total) => {
  if (!total || total === 0) return 0;
  return Math.round((current / total) * 100);
};

// Format number with commas
export const formatNumber = (num) => {
  if (!num) return '0';
  return num.toLocaleString();
};

// Generate random color for tags
export const getTagColor = (tag) => {
  const colors = [
    'bg-blue-100 text-blue-800',
    'bg-green-100 text-green-800',
    'bg-yellow-100 text-yellow-800',
    'bg-red-100 text-red-800',
    'bg-purple-100 text-purple-800',
    'bg-pink-100 text-pink-800',
    'bg-indigo-100 text-indigo-800',
    'bg-gray-100 text-gray-800',
  ];
  
  // Simple hash function to consistently assign colors
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return colors[Math.abs(hash) % colors.length];
};

// Validate email
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate URL
export const isValidUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// Debounce function
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Copy to clipboard
export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
      document.body.removeChild(textArea);
      return true;
    } catch (err) {
      document.body.removeChild(textArea);
      return false;
    }
  }
};

// Generate share URL
export const generateShareUrl = (path) => {
  return `${window.location.origin}${path}`;
};

// Parse query parameters
export const parseQueryParams = (search) => {
  const params = new URLSearchParams(search);
  const result = {};
  for (const [key, value] of params) {
    result[key] = value;
  }
  return result;
};

// Build query string
export const buildQueryString = (params) => {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      searchParams.append(key, value);
    }
  });
  return searchParams.toString();
};