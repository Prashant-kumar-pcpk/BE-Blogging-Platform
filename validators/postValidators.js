const Joi = require('joi');

const mediaItemSchema = Joi.object({
  url: Joi.string().uri().required(),
  type: Joi.string().valid('image', 'video', 'audio').required(),
  name: Joi.string().allow('').max(255).optional()
});

const categorySchema = Joi.object({
  name: Joi.string().trim().min(2).max(80).required(),
  description: Joi.string().trim().allow('').max(500).optional(),
  color: Joi.string().trim().allow('').max(20).optional(),
  icon: Joi.string().trim().allow('').max(50).optional()
});

const postSchema = Joi.object({
  title: Joi.string().trim().min(3).max(200).required(),
  content: Joi.string().trim().required(),
  excerpt: Joi.string().trim().allow('').max(100000).optional(),
  categoryName: Joi.string().trim().min(2).max(80).required(),
  tags: Joi.alternatives().try(
    Joi.array().items(Joi.string().trim().max(50)).max(20),
    Joi.string().allow('')
  ).optional(),
  status: Joi.string().valid('draft', 'published', 'archived').optional(),
  featuredImage: Joi.string().allow('').uri().optional(),
  media: Joi.array().items(mediaItemSchema).optional()
});

module.exports = {
  categorySchema,
  postSchema
};
