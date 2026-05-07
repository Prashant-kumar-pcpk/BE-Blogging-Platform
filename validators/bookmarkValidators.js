const Joi = require('joi');

const bookmarkSchema = Joi.object({
  postId: Joi.string().trim().required()
});

module.exports = { bookmarkSchema };
