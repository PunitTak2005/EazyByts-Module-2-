import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import AppError from '../utils/AppError.js';
import emailService from './emailService.js';

class AuthService {
  // Generate short-lived access token (1d) and longer refresh token (7d)
  generateAccessToken(user) {
    return jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'stock_market_simulator_jwt_secret_token_987654321',
      { expiresIn: '1d' }
    );
  }

  generateRefreshToken(user) {
    return jwt.sign(
      { id: user._id },
      process.env.JWT_REFRESH_SECRET || 'stock_market_simulator_jwt_refresh_token_123456789',
      { expiresIn: '7d' }
    );
  }

  async register(name, email, password) {
    const userExists = await User.findOne({ email });
    if (userExists) {
      throw new AppError('User with this email already exists', 400);
    }

    const totalUsers = await User.countDocuments({});
    const role = totalUsers === 0 ? 'admin' : 'user';

    const user = await User.create({
      name,
      email,
      password,
      role
    });

    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);

    return {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        balance: user.balance,
        preferences: user.preferences
      },
      accessToken,
      refreshToken
    };
  }

  async login(email, password) {
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      throw new AppError('Invalid email or password', 401);
    }


    if (!user.isActive) {
      throw new AppError('User account has been disabled/banned', 403);
    }

    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);

    return {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        balance: user.balance,
        preferences: user.preferences,
        avatar: user.avatar
      },
      accessToken,
      refreshToken
    };
  }

  async refresh(token) {
    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_REFRESH_SECRET || 'stock_market_simulator_jwt_refresh_token_123456789'
      );
      
      const user = await User.findById(decoded.id);
      if (!user || !user.isActive) {
        throw new AppError('User not found or disabled', 404);
      }

      const accessToken = this.generateAccessToken(user);
      const newRefreshToken = this.generateRefreshToken(user);

      return {
        accessToken,
        refreshToken: newRefreshToken
      };
    } catch (error) {
      throw new AppError('Invalid or expired refresh token', 401);
    }
  }

  async forgotPassword(email) {
    const normalizedEmail = (email || '').trim().toLowerCase();
    console.log('[AuthService] Forgot password request received for:', normalizedEmail);

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      console.log('[AuthService] Account lookup completed: No matching user found (privacy response returned)');
      return {
        success: true,
        message: 'If an account exists for this email, a password reset link has been sent.',
      };
    }

    console.log('[AuthService] User lookup successful for ID:', user._id);

    // Generate cryptographically secure 32-byte hex token (64 hex characters)
    const resetToken = crypto.randomBytes(32).toString('hex');

    // Hash token using SHA-256 for secure database storage
    user.resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // Expiry time set to 1 hour (3600 seconds)
    user.resetPasswordExpire = Date.now() + 60 * 60 * 1000;

    await user.save();
    console.log('[AuthService] Reset token generated & hashed token stored in DB');

    // Initiate email delivery asynchronously in the background so API response completes immediately
    setImmediate(() => {
      console.log('[AuthService] Initiating async background email delivery...');
      emailService.sendPasswordResetEmail({
        email: user.email,
        name: user.name,
        resetToken,
      }).then(emailResult => {
        if (emailResult.success) {
          console.log('[AuthService] Password reset email sent successfully. MessageId:', emailResult.messageId);
        } else {
          console.warn('[AuthService] Email dispatch logged warning:', emailResult.error || 'SMTP delivery pending');
        }
      }).catch(err => {
        console.error('[AuthService] Background email dispatch error:', err.message || err);
      });
    });

    return {
      success: true,
      message: 'If an account exists for this email, a password reset link has been sent.',
      resetToken,
    };
  }

  async resetPassword(resetToken, newPassword) {
    // 1. Token Verification (SHA-256 computation)
    const t0 = performance.now();
    const hashedToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    const tokenVerifyMs = Math.round(performance.now() - t0);

    // 2. Fast Indexed User Lookup
    const t1 = performance.now();
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() }
    }).select('_id email name').lean();
    const userLookupMs = Math.round(performance.now() - t1);

    if (!user) {
      throw new AppError('Invalid or expired reset token', 400);
    }

    // 3. Single-Pass Bcrypt Password Hashing (10 rounds)
    const t2 = performance.now();
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    const passwordHashMs = Math.round(performance.now() - t2);

    // 4. Atomic Database Update (Direct update, avoiding full document re-save & hook overhead)
    const t3 = performance.now();
    await User.updateOne(
      { _id: user._id },
      {
        $set: { password: hashedPassword },
        $unset: { resetPasswordToken: 1, resetPasswordExpire: 1 }
      }
    );
    const dbUpdateMs = Math.round(performance.now() - t3);

    // 5. Asynchronous Confirmation Email Queueing (Non-blocking background dispatch)
    const t4 = performance.now();
    setImmediate(() => {
      emailService.sendPasswordResetConfirmationEmail({
        email: user.email,
        name: user.name
      }).catch(err => {
        console.error('[AuthService] Background confirmation email dispatch error:', err.message || err);
      });
    });
    const emailQueueMs = Math.round(performance.now() - t4);

    return {
      user: { id: user._id, email: user.email },
      timings: {
        tokenVerifyMs,
        userLookupMs,
        passwordHashMs,
        dbUpdateMs,
        emailQueueMs
      }
    };
  }
}

export default new AuthService();
