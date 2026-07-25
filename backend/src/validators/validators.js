import { body, validationResult } from 'express-validator';

export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorList = errors.array().map(e => e.msg);
    return res.status(400).json({
      success: false,
      message: errorList[0] || 'Input validation failed',
      errors: errorList
    });
  }
  next();
};

export const registerValidator = [
  body('name').trim().notEmpty().withMessage('Full Name is required'),
  body('email').isEmail().withMessage('Provide a valid email address'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  validate
];

export const loginValidator = [
  body('email').isEmail().withMessage('Provide a valid email address'),
  body('password').notEmpty().withMessage('Password is required'),
  validate
];

export const updateProfileValidator = [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be blank'),
  body('avatar').optional().isString().withMessage('Avatar must be a URL string'),
  body('preferences').optional().isObject().withMessage('Preferences must be an object'),
  validate
];

export const placeOrderValidator = [
  body('symbol').trim().notEmpty().withMessage('Stock symbol is required').toUpperCase(),
  body('quantity').isInt({ min: 1 }).withMessage('Quantity must be greater than zero.'),
  body('orderType').isIn(['MARKET', 'LIMIT']).withMessage('Order type must be MARKET or LIMIT'),
  body('limitPrice')
    .if(body('orderType').equals('LIMIT'))
    .isFloat({ min: 0.01 })
    .withMessage('Limit price must be positive and greater than 0 for LIMIT orders'),
  validate
];

export const passwordValidator = [
  body('newPassword').isLength({ min: 6 }).withMessage('New Password must be at least 6 characters long'),
  validate
];

export const forgotPasswordValidator = [
  body('email').isEmail().withMessage('Provide a valid email address'),
  validate
];

export const resetPasswordValidator = [
  body('token').trim().notEmpty().withMessage('Token is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters long'),
  validate
];

export const createWatchlistValidator = [
  body('name').trim().notEmpty().withMessage('Watchlist name is required'),
  validate
];
