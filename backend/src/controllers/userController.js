import UserService from '../services/UserService.js';
import { sendSuccess } from './authController.js';

export const getProfile = async (req, res, next) => {
  try {
    const user = await UserService.getProfile(req.user._id);
    return sendSuccess(res, 'User profile fetched successfully', {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      balance: user.balance,
      avatar: user.avatar,
      preferences: user.preferences,
      notificationSettings: user.notificationSettings,
      createdAt: user.createdAt
    });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const user = await UserService.updateProfile(req.user._id, req.body);
    return sendSuccess(res, 'Profile updated successfully', {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      balance: user.balance,
      avatar: user.avatar,
      preferences: user.preferences,
      notificationSettings: user.notificationSettings
    });
  } catch (error) {
    next(error);
  }
};

export const uploadAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    const avatarUrl = await UserService.uploadAvatar(req.user._id, req.file);
    return sendSuccess(res, 'Avatar uploaded successfully', { avatar: avatarUrl });
  } catch (error) {
    next(error);
  }
};

export const removeAvatar = async (req, res, next) => {
  try {
    const avatarUrl = await UserService.removeAvatar(req.user._id);
    return sendSuccess(res, 'Avatar removed successfully', { avatar: avatarUrl });
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req, res, next) => {
  const { newPassword } = req.body;
  try {
    const result = await UserService.changePassword(req.user._id, newPassword);
    return sendSuccess(res, result.message);
  } catch (error) {
    next(error);
  }
};

export const deleteAccount = async (req, res, next) => {
  try {
    const result = await UserService.deleteAccount(req.user._id);
    res.clearCookie('refreshToken');
    return sendSuccess(res, result.message);
  } catch (error) {
    next(error);
  }
};

export const getPreferences = async (req, res, next) => {
  try {
    const user = await UserService.getProfile(req.user._id);
    return sendSuccess(res, 'Preferences retrieved successfully', user.preferences);
  } catch (error) {
    next(error);
  }
};

export const updateThemePreference = async (req, res, next) => {
  const { theme } = req.body;
  if (!['light', 'dark', 'system'].includes(theme)) {
    return res.status(400).json({ success: false, message: 'Invalid theme preference. Must be light, dark, or system.' });
  }
  try {
    const user = await UserService.updateThemePreference(req.user._id, theme);
    return sendSuccess(res, 'Theme preference updated successfully', { theme: user.preferences.theme });
  } catch (error) {
    next(error);
  }
};

export const resetBalance = async (req, res, next) => {
  try {
    const amount = req.body.amount !== undefined ? parseFloat(req.body.amount) : 1000000;
    const user = await UserService.resetBalance(req.user._id, amount);
    return sendSuccess(res, 'Virtual balance updated successfully', { balance: user.balance });
  } catch (error) {
    next(error);
  }
};
