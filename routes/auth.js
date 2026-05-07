const express = require('express');
const router = express.Router();
const {
  register,
  login,
  refreshSession,
  getProfile,
  updateProfile,
  changePassword,
  resetPassword,
  getMyComments,
  deleteMyComment,
  followUser,
  unfollowUser
} = require('../controller/authController');
const {
  getBookmarks,
  addBookmark,
  removeBookmark,
  isPostBookmarked
} = require('../controller/bookmarkController');
const authMiddleware = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const { bookmarkSchema } = require('../validators/bookmarkValidators');
const {
  registerSchema,
  loginSchema,
  refreshSchema,
  resetPasswordSchema,
  changePasswordSchema,
  updateProfileSchema
} = require('../validators/authValidators');

// Public routes
router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.post('/refresh', validate(refreshSchema), refreshSession);
router.post('/reset-password', validate(resetPasswordSchema), resetPassword);

// Protected routes
router.get('/profile', authMiddleware, getProfile);
router.put('/profile', authMiddleware, validate(updateProfileSchema), updateProfile);
router.put('/change-password', authMiddleware, validate(changePasswordSchema), changePassword);
router.get('/comments', authMiddleware, getMyComments);
router.delete('/comments/:commentId', authMiddleware, deleteMyComment);
router.post('/follow/:userId', authMiddleware, followUser);
router.delete('/follow/:userId', authMiddleware, unfollowUser);
router.get('/bookmarks', authMiddleware, getBookmarks);
router.post('/bookmarks', authMiddleware, validate(bookmarkSchema), addBookmark);
router.delete('/bookmarks', authMiddleware, validate(bookmarkSchema), removeBookmark);
router.get('/bookmarks/:postId', authMiddleware, isPostBookmarked);

module.exports = router;
