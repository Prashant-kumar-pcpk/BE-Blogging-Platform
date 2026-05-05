const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const {
  getPublishedPosts,
  getUserPosts,
  getPostBySlug,
  getPostsByCategory,
  createPost,
  getCategories,
  getPostComments,
  createComment,
  deleteComment
} = require('../controller/postController');

router.get('/', getPublishedPosts);
router.get('/me', authMiddleware, getUserPosts);
router.get('/categories', getCategories);
router.get('/category/:slug', getPostsByCategory);
router.get('/:slug/comments', getPostComments);
router.post('/:slug/comments', authMiddleware, createComment);
router.delete('/:slug/comments/:commentId', authMiddleware, deleteComment);
router.get('/:slug', getPostBySlug);
router.post('/', authMiddleware, createPost);

module.exports = router;
