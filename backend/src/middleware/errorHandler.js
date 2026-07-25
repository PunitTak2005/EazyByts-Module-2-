export const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error stack for developer view
  console.error(err.stack || err);

  // Mongoose duplicate key error (code 11000)
  if (err.code === 11000) {
    const message = 'Duplicate field value entered. A record with these attributes already exists.';
    return res.status(400).json({
      success: false,
      message,
      errors: [err.keyValue]
    });
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(val => val.message);
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  // Mongoose cast error (invalid ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: `Invalid ID value: ${err.value}`,
      errors: []
    });
  }

  // JWT expired/invalid error
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Access token validation failed',
      errors: []
    });
  }

  // Standard response formatting
  return res.status(err.status || 500).json({
    success: false,
    message: error.message || 'Internal Server Error',
    errors: []
  });
};

export const notFound = (req, res, next) => {
  console.warn(`[404] Not Found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    message: `API Route not found - ${req.originalUrl}`,
    errors: []
  });
};
