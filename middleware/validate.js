const validate = (schema, property = 'body') => (req, res, next) => {
  const { error, value } = schema.validate(req[property], {
    abortEarly: false,
    stripUnknown: true
  });

  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed.',
      errors: error.details.map((detail) => detail.message)
    });
  }

  req[property] = value;
  return next();
};

module.exports = validate;
