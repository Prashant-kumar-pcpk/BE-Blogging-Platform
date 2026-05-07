const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const { authorizeRoles } = require('../middleware/authorize');
const { postSchema, categorySchema } = require('../validators/postValidators');
const { commentSchema } = require('../validators/commentValidators');
const {
  getCommentsByPostSlug,
  createCommentByPostSlug,
  updateComment,
  deleteComment
} = require('../controller/commentController');
const {
  getPublishedPosts,
  getAuthors,
  getUserPosts,
  getUserPostById,
  getPostBySlug,
  getPostsByCategory,
  getPostsByTag,
  getRelatedPosts,
  getAuthorProfileByUsername,
  createPost,
  updatePost,
  getCategories,
  getTags,
  createCategory,
  updateCategory,
  deleteCategory,
  getCommentsForModeration,
  moderateComment,
  deletePost
} = require('../controller/postController');
const {
  toggleLike,
  getLikes,
  isPostLiked
} = require('../controller/likeController');

router.get('/', getPublishedPosts);
router.get('/authors', getAuthors);
router.get('/me', authMiddleware, authorizeRoles('user', 'admin'), getUserPosts);
router.get('/manage/:postId', authMiddleware, authorizeRoles('user', 'admin'), getUserPostById);
router.put('/manage/:postId', authMiddleware, authorizeRoles('user', 'admin'), validate(postSchema), updatePost);
router.get('/categories', getCategories);
router.post('/categories', authMiddleware, authorizeRoles('user', 'admin'), validate(categorySchema), createCategory);
router.put('/categories/:categoryId', authMiddleware, authorizeRoles('user', 'admin'), validate(categorySchema), updateCategory);
router.delete('/categories/:categoryId', authMiddleware, authorizeRoles('user', 'admin'), deleteCategory);
router.get('/tags', getTags);
router.get('/category/:slug', getPostsByCategory);
router.get('/tag/:slug', getPostsByTag);
router.get('/author/:username', getAuthorProfileByUsername);
router.get('/:slug/related', getRelatedPosts);
router.get('/related/:slug', getRelatedPosts);
router.get('/:slug/likes', getLikes);
router.get('/likes/:slug', getLikes);
router.get('/:slug/comments', getCommentsByPostSlug);
router.get('/comments/:slug', getCommentsByPostSlug);
router.get('/:slug/comments/moderation', authMiddleware, authorizeRoles('user', 'admin'), getCommentsForModeration);
router.post('/:slug/comments', authMiddleware, authorizeRoles('user', 'admin'), validate(commentSchema), createCommentByPostSlug);
router.post('/comments/:slug', authMiddleware, authorizeRoles('user', 'admin'), validate(commentSchema), createCommentByPostSlug);
router.put('/:slug/comments/:commentId', authMiddleware, authorizeRoles('user', 'admin'), validate(commentSchema), updateComment);
router.patch('/:slug/comments/:commentId/moderate', authMiddleware, authorizeRoles('user', 'admin'), moderateComment);
router.delete('/:slug/comments/:commentId', authMiddleware, authorizeRoles('user', 'admin'), deleteComment);
router.delete('/:postId', authMiddleware, authorizeRoles('user', 'admin'), deletePost);
router.post('/:slug/like', authMiddleware, authorizeRoles('user', 'admin'), toggleLike);
router.post('/like/:slug', authMiddleware, authorizeRoles('user', 'admin'), toggleLike);
router.get('/:slug/like/check', authMiddleware, isPostLiked);
router.get('/like/:slug/check', authMiddleware, isPostLiked);
router.get('/:slug', getPostBySlug);
router.post('/', authMiddleware, authorizeRoles('user', 'admin'), validate(postSchema), createPost);

module.exports = router;
