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

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refreshSession);
router.post('/reset-password', resetPassword);

// Protected routes
router.get('/profile', authMiddleware, getProfile);
router.put('/profile', authMiddleware, updateProfile);
router.put('/change-password', authMiddleware, changePassword);
router.get('/comments', authMiddleware, getMyComments);
router.delete('/comments/:commentId', authMiddleware, deleteMyComment);
router.post('/follow/:userId', authMiddleware, followUser);
router.delete('/follow/:userId', authMiddleware, unfollowUser);
router.get('/bookmarks', authMiddleware, getBookmarks);
router.post('/bookmarks', authMiddleware, addBookmark);
router.delete('/bookmarks', authMiddleware, removeBookmark);
router.get('/bookmarks/:postId', authMiddleware, isPostBookmarked);

module.exports = router;
