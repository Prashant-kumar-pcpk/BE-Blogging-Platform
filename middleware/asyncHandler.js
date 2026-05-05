const asyncHandler = (handler) => {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch((error) => {
      if (typeof next === 'function') {
        return next(error);
      }

      console.error('Async handler error: next is not a function', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Server Error'
      });
    });
  };
};

module.exports = asyncHandler;
