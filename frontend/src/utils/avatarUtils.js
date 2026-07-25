/**
 * Helper to construct the full URL for an avatar, handling both external
 * URLs (like Unsplash presets) and local uploads from the backend.
 * 
 * @param {string} avatarPath - The raw avatar string from the user object
 * @returns {string|null} - The fully qualified URL
 */
import { API_URL } from '@/services/api';

export const getAvatarUrl = (avatarPath) => {
  if (!avatarPath) return null;
  
  if (avatarPath.startsWith('http') || avatarPath.startsWith('data:')) {
    return avatarPath;
  }
  
  // Backend URL (assumes VITE_API_URL or API_URL is like http://localhost:5009/api)
  const envUrl = import.meta.env.VITE_API_URL || API_URL;
  const baseUrl = envUrl ? envUrl.replace(/\/api\/?$/, '') : '';
  
  return `${baseUrl}${avatarPath}`;
};
