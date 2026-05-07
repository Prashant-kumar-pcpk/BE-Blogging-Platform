const Joi = require('joi');

const socialLinksSchema = Joi.object({
  twitter: Joi.string().allow('').uri().messages({ 'string.uri': 'Twitter must be a valid URL.' }),
  linkedin: Joi.string().allow('').uri().messages({ 'string.uri': 'LinkedIn must be a valid URL.' }),
  github: Joi.string().allow('').uri().messages({ 'string.uri': 'GitHub must be a valid URL.' }),
  website: Joi.string().allow('').uri().messages({ 'string.uri': 'Website must be a valid URL.' })
});

const registerSchema = Joi.object({
  username: Joi.string().trim().min(3).max(50).required(),
  email: Joi.string().trim().email().required(),
  password: Joi.string()
    .min(8)
    .pattern(/[A-Z]/, 'uppercase letter')
    .pattern(/[a-z]/, 'lowercase letter')
    .pattern(/[0-9]/, 'number')
    .required()
});

const loginSchema = Joi.object({
  email: Joi.string().trim().email().required(),
  password: Joi.string().required()
});

const refreshSchema = Joi.object({
  refreshToken: Joi.string().required()
});

const resetPasswordSchema = Joi.object({
  email: Joi.string().trim().email().required(),
  newPassword: Joi.string()
    .min(8)
    .pattern(/[A-Z]/, 'uppercase letter')
    .pattern(/[a-z]/, 'lowercase letter')
    .pattern(/[0-9]/, 'number')
    .required()
});

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string()
    .min(8)
    .pattern(/[A-Z]/, 'uppercase letter')
    .pattern(/[a-z]/, 'lowercase letter')
    .pattern(/[0-9]/, 'number')
    .required()
});

const updateProfileSchema = Joi.object({
  username: Joi.string().trim().min(3).max(50).optional(),
  bio: Joi.string().trim().allow('').max(500).optional(),
  profilePicture: Joi.string().allow('').uri().optional(),
  socialLinks: socialLinksSchema.optional()
});

module.exports = {
  registerSchema,
  loginSchema,
  refreshSchema,
  resetPasswordSchema,
  changePasswordSchema,
  updateProfileSchema
};
