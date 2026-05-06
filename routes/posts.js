const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const {
  getPublishedPosts,
  getUserPosts,
  getPostBySlug,
  getPostsByCategory,
  getPostsByTag,
  getRelatedPosts,
  getAuthorProfileByUsername,
  createPost,
  getCategories,
  getTags,
  createCategory,
  updateCategory,
  deleteCategory,
  getPostComments,
  getCommentsForModeration,
  createComment,
  updateComment,
  moderateComment,
  deleteComment,
  deletePost
} = require('../controller/postController');
const {
  toggleLike,
  getLikes,
  isPostLiked
} = require('../controller/likeController');

router.get('/', getPublishedPosts);
router.get('/me', authMiddleware, getUserPosts);
router.get('/categories', getCategories);
router.post('/categories', authMiddleware, createCategory);
router.put('/categories/:categoryId', authMiddleware, updateCategory);
router.delete('/categories/:categoryId', authMiddleware, deleteCategory);
router.get('/tags', getTags);
router.get('/category/:slug', getPostsByCategory);
router.get('/tag/:slug', getPostsByTag);
router.get('/author/:username', getAuthorProfileByUsername);
router.get('/:slug/related', getRelatedPosts);
router.get('/related/:slug', getRelatedPosts);
router.get('/:slug/likes', getLikes);
router.get('/likes/:slug', getLikes);
router.get('/:slug/comments', getPostComments);
router.get('/comments/:slug', getPostComments);
router.get('/:slug/comments/moderation', authMiddleware, getCommentsForModeration);
router.post('/:slug/comments', authMiddleware, createComment);
router.post('/comments/:slug', authMiddleware, createComment);
router.put('/:slug/comments/:commentId', authMiddleware, updateComment);
router.patch('/:slug/comments/:commentId/moderate', authMiddleware, moderateComment);
router.delete('/:slug/comments/:commentId', authMiddleware, deleteComment);
router.delete('/:postId', authMiddleware, deletePost);
router.post('/:slug/like', authMiddleware, toggleLike);
router.post('/like/:slug', authMiddleware, toggleLike);
router.get('/:slug/like/check', authMiddleware, isPostLiked);
router.get('/like/:slug/check', authMiddleware, isPostLiked);
router.get('/:slug', getPostBySlug);
router.post('/', authMiddleware, createPost);

module.exports = router;
