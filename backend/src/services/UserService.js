import User from '../models/User.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import Portfolio from '../models/Portfolio.js';
import Holding from '../models/Holding.js';
import Trade from '../models/Trade.js';
import Watchlist from '../models/Watchlist.js';
import Notification from '../models/Notification.js';
import { uploadAvatarToCloudinary, deleteAvatarFromCloudinary } from './cloudinaryService.js';

class UserService {
  async getProfile(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Clean up any legacy local /uploads/ avatar paths on profile fetch
    if (user.avatar && user.avatar.startsWith('/uploads/')) {
      console.warn(`[Avatar Migration Log] Cleaning legacy local avatar path for user ${userId}: ${user.avatar}`);
      user.avatar = '';
      await user.save();
    }

    return user;
  }

  async updateProfile(userId, updateData) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    if (updateData.name) user.name = updateData.name;
    if (updateData.avatar !== undefined) user.avatar = updateData.avatar;
    
    if (updateData.preferences) {
      user.preferences = {
        ...user.preferences,
        ...updateData.preferences
      };
    }

    if (updateData.notificationSettings) {
      user.notificationSettings = {
        ...user.notificationSettings,
        ...updateData.notificationSettings
      };
    }

    if (updateData.balance !== undefined && !isNaN(updateData.balance)) {
      const newBal = Math.max(0, parseFloat(updateData.balance));
      user.balance = newBal;
      const Portfolio = (await import('../models/Portfolio.js')).default;
      const p = await Portfolio.findOne({ userId });
      if (p) {
        p.availableCash = newBal;
        await p.save();
      }
    }

    await user.save();
    return user;
  }

  async resetBalance(userId, amount = 1000000) {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    const newBalance = Math.max(0, parseFloat(amount) || 1000000);
    user.balance = newBalance;
    await user.save();

    const Portfolio = (await import('../models/Portfolio.js')).default;
    const p = await Portfolio.findOne({ userId });
    if (p) {
      p.availableCash = newBalance;
      await p.save();
    }

    return user;
  }

  async uploadAvatar(userId, file) {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    if (!file || (!file.buffer && !file.path)) {
      throw new Error('No avatar image file provided');
    }

    // If user previously had a Cloudinary avatar, attempt to delete old asset
    if (user.avatar && user.avatar.includes('cloudinary.com')) {
      await deleteAvatarFromCloudinary(user.avatar);
    }

    // Upload directly to Cloudinary
    const filePayload = file.buffer || file.path;
    const { url: avatarUrl } = await uploadAvatarToCloudinary(filePayload, file.mimetype);

    console.log(`[Cloudinary Avatar Upload Log] Success for User ${userId} | Avatar URL: ${avatarUrl}`);

    user.avatar = avatarUrl;
    await user.save();
    return avatarUrl;
  }

  async removeAvatar(userId) {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    if (user.avatar && user.avatar.includes('cloudinary.com')) {
      await deleteAvatarFromCloudinary(user.avatar);
    }

    user.avatar = '';
    await user.save();
    console.log(`[Cloudinary Avatar Log] Avatar removed for user ${userId}`);
    return user.avatar;
  }

  async changePassword(userId, newPassword) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    user.password = newPassword; // this triggers pre-save bcrypt hash
    await user.save();
    return { message: 'Password changed successfully' };
  }

  async deleteAccount(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Clean up related schemas of this user to maintain integrity
    await User.findByIdAndDelete(userId);
    await Portfolio.findOneAndDelete({ userId });
    await Holding.deleteMany({ userId });
    await Trade.deleteMany({ userId });
    await Watchlist.deleteMany({ userId });
    await Notification.deleteMany({ userId });

    return { message: 'User account and all related portfolio history deleted successfully' };
  }

  async updateThemePreference(userId, theme) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    user.preferences = {
      ...user.preferences,
      theme
    };
    return await user.save();
  }
}

export default new UserService();
