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

class UserService {
  async getProfile(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
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

    return await user.save();
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

    let avatarUrl = '';
    if (file && file.buffer) {
      const base64 = file.buffer.toString('base64');
      avatarUrl = `data:${file.mimetype || 'image/png'};base64,${base64}`;
    } else if (file && file.filename) {
      avatarUrl = `/uploads/avatars/${file.filename}`;
    } else {
      throw new Error('Invalid file payload');
    }

    user.avatar = avatarUrl;
    await user.save();
    return avatarUrl;
  }

  async removeAvatar(userId) {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    if (user.avatar && user.avatar.startsWith('/uploads/avatars/')) {
      const oldPath = path.join(__dirname, '..', '..', 'public', user.avatar);
      if (fs.existsSync(oldPath)) {
        try { fs.unlinkSync(oldPath); } catch (e) { /* ignore read-only */ }
      }
    }

    user.avatar = ''; // or default avatar URL if preferred
    await user.save();
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
