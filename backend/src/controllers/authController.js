import AuthService from '../services/AuthService.js';

// Response format helpers
export const sendSuccess = (res, message, data = {}, status = 200) => {
  return res.status(status).json({
    success: true,
    message,
    data
  });
};

export const register = async (req, res, next) => {
  const { name, email, password } = req.body;
  try {
    const result = await AuthService.register(name, email, password);
    
    // Also save refresh token in HTTP-only cookie for extra security!
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    return sendSuccess(res, 'User registered successfully', {
      user: result.user,
      token: result.accessToken
    }, 201);
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  const { email, password } = req.body;
  try {
    const result = await AuthService.login(email, password);

    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    return sendSuccess(res, 'User authenticated successfully', {
      user: result.user,
      token: result.accessToken
    });
  } catch (error) {
    next(error);
  }
};

export const refresh = async (req, res, next) => {
  const token = req.cookies.refreshToken || req.body.refreshToken;
  try {
    if (!token) {
      return res.status(400).json({ success: false, message: 'Refresh token is required' });
    }

    const result = await AuthService.refresh(token);

    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return sendSuccess(res, 'Access token refreshed successfully', {
      token: result.accessToken
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res, next) => {
  try {
    res.clearCookie('refreshToken');
    return sendSuccess(res, 'User logged out successfully');
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (req, res, next) => {
  const { email } = req.body;
  try {
    const result = await AuthService.forgotPassword(email);
    return res.status(200).json({
      success: true,
      message: result.message || 'If an account exists for this email, a password reset link has been sent.',
      data: {
        resetToken: result.resetToken
      }
    });
  } catch (error) {
    console.error('[AuthController] Exception during forgotPassword processing:', error.message || error);
    return res.status(200).json({
      success: true,
      message: 'If an account exists for this email, a password reset link has been sent.',
    });
  }
};

export const resetPassword = async (req, res, next) => {
  const reqStart = performance.now();
  const { token, newPassword } = req.body;
  try {
    const result = await AuthService.resetPassword(token, newPassword);
    const { timings } = result;

    const totalMs = Math.round(performance.now() - reqStart);
    const validationMs = Math.max(1, Math.round(totalMs - (timings.userLookupMs + timings.tokenVerifyMs + timings.passwordHashMs + timings.dbUpdateMs + timings.emailQueueMs)));

    console.log('\n--- Reset Password Performance Metrics ---');
    console.log(`Validation: ${validationMs}ms`);
    console.log(`User Lookup: ${timings.userLookupMs}ms`);
    console.log(`Token Verify: ${timings.tokenVerifyMs}ms`);
    console.log(`Password Hash: ${timings.passwordHashMs}ms`);
    console.log(`Database Update: ${timings.dbUpdateMs}ms`);
    console.log(`Email Queue: ${timings.emailQueueMs}ms`);
    console.log(`Total: ${totalMs}ms`);
    console.log('-----------------------------------------\n');

    return sendSuccess(res, 'Your profile password has been updated. Please login again.');
  } catch (error) {
    next(error);
  }
};
