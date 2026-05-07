const Joi = require('joi');

const commentSchema = Joi.object({
  content: Joi.string().trim().min(1).max(1000).required(),
  parentComment: Joi.string().trim().optional()
});

const replySchema = Joi.object({
  content: Joi.string().trim().min(1).max(1000).required()
});

module.exports = {
  commentSchema,
  replySchema
};
