/**
 * Default fallback avatar image path.
 */
export const DEFAULT_AVATAR_URL = '/default-avatar.png';

export const getDefaultAvatarUrl = () => DEFAULT_AVATAR_URL;

/**
 * Universal helper to resolve avatar URLs across the application.
 * 
 * Rules:
 * - If avatar is a Cloudinary URL (https://res.cloudinary.com/...) -> return it directly.
 * - If avatar is a valid HTTP/HTTPS URL or Base64 Data URI -> return it directly.
 * - If avatar is empty, undefined, null, or a legacy local (/uploads/...) path -> return DEFAULT_AVATAR_URL.
 * - Never return undefined or construct /uploads/... URLs.
 * 
 * @param {string|object} userOrPath - The user object or raw avatar string
 * @returns {string} - Valid HTTPS image URL or default avatar path
 */
export const getAvatarUrl = (userOrPath) => {
  if (!userOrPath) return DEFAULT_AVATAR_URL;

  // Extract avatar string if user object was provided
  let avatar = typeof userOrPath === 'object'
    ? (userOrPath.avatar || userOrPath.profileImage || '')
    : userOrPath;

  if (typeof avatar !== 'string' || !avatar.trim()) {
    return DEFAULT_AVATAR_URL;
  }

  avatar = avatar.trim();

  // 1. Cloudinary URLs
  if (avatar.includes('cloudinary.com') || avatar.startsWith('https://res.cloudinary.com/')) {
    return avatar;
  }

  // 2. Absolute HTTPS / HTTP / Data URIs
  if (avatar.startsWith('https://') || avatar.startsWith('http://') || avatar.startsWith('data:')) {
    return avatar;
  }

  // 3. Reject legacy local /uploads/ or disk paths and return default avatar
  if (avatar.startsWith('/uploads/') || avatar.startsWith('uploads/') || avatar.includes('/avatars/')) {
    return DEFAULT_AVATAR_URL;
  }

  // Fallback safe default
  return DEFAULT_AVATAR_URL;
};
