const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const { authorizeRoles } = require('../middleware/authorize');
const { commentSchema, replySchema } = require('../validators/commentValidators');
const {
  getCommentsByPostSlug,
  createCommentByPostSlug,
  updateComment,
  deleteComment,
  toggleCommentLike,
  replyToComment
} = require('../controller/commentController');

router.get('/post/:slug', getCommentsByPostSlug);
router.post('/post/:slug', authMiddleware, authorizeRoles('user', 'admin'), validate(commentSchema), createCommentByPostSlug);
router.put('/:commentId', authMiddleware, authorizeRoles('user', 'admin'), validate(commentSchema), updateComment);
router.delete('/:commentId', authMiddleware, authorizeRoles('user', 'admin'), deleteComment);
router.post('/:commentId/like', authMiddleware, authorizeRoles('user', 'admin'), toggleCommentLike);
router.post('/:commentId/reply', authMiddleware, authorizeRoles('user', 'admin'), validate(replySchema), replyToComment);

module.exports = router;
