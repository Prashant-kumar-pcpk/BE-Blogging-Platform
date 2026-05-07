const Comment = require('../models/Comment');
const Post = require('../models/Post');
const asyncHandler = require('../middleware/asyncHandler');

const COMMENT_AUTHOR_FIELDS = 'username profilePicture bio socialLinks';

const sanitizeCommentContent = (content = '') =>
  content
    .replace(/\s+/g, ' ')
    .trim();

const populateReplies = {
  path: 'replies',
  populate: [
    { path: 'author', select: COMMENT_AUTHOR_FIELDS },
    {
      path: 'replies',
      populate: [{ path: 'author', select: COMMENT_AUTHOR_FIELDS }]
    }
  ],
  options: { sort: { createdAt: 1 } }
};

const populateCommentList = (query) =>
  query
    .populate('author', COMMENT_AUTHOR_FIELDS)
    .populate(populateReplies);

const ensurePostBySlug = async (slug) => {
  const post = await Post.findOne({ slug }).select('_id author');
  return post;
};

const ensureCommentById = async (commentId) => {
  const comment = await Comment.findById(commentId);
  return comment;
};

const userCanModerate = (user, post) =>
  Boolean(user && post && (user.role === 'admin' || post.author?.toString() === user._id.toString()));

const getCommentsByPostSlug = asyncHandler(async (req, res) => {
  const post = await ensurePostBySlug(req.params.slug);

  if (!post) {
    return res.status(404).json({ message: 'Post not found' });
  }

  const comments = await populateCommentList(
    Comment.find({
      post: post._id,
      parentComment: null,
      isSpam: false,
      isApproved: true
    }).sort({ createdAt: -1 })
  );

  res.json(comments);
});

const createCommentByPostSlug = asyncHandler(async (req, res) => {
  const post = await ensurePostBySlug(req.params.slug);

  if (!post) {
    return res.status(404).json({ message: 'Post not found' });
  }

  const content = sanitizeCommentContent(req.body.content);
  const parentCommentId = req.body.parentComment || null;

  if (!content) {
    return res.status(400).json({ message: 'Comment content is required.' });
  }

  if (content.length > 1000) {
    return res.status(400).json({ message: 'Comment cannot exceed 1000 characters.' });
  }

  let parentComment = null;
  if (parentCommentId) {
    parentComment = await Comment.findOne({ _id: parentCommentId, post: post._id });
    if (!parentComment) {
      return res.status(404).json({ message: 'Parent comment not found.' });
    }
  }

  const comment = await Comment.create({
    content,
    author: req.user._id,
    post: post._id,
    parentComment: parentComment?._id || null
  });

  if (parentComment) {
    parentComment.replies.push(comment._id);
    await parentComment.save();
  } else {
    await Post.findByIdAndUpdate(post._id, {
      $addToSet: { comments: comment._id }
    });
  }

  const populatedComment = await populateCommentList(Comment.findById(comment._id));

  res.status(201).json(populatedComment);
});

const updateComment = asyncHandler(async (req, res) => {
  const comment = await ensureCommentById(req.params.commentId);

  if (!comment) {
    return res.status(404).json({ message: 'Comment not found.' });
  }

  if (comment.author.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'You can only edit your own comments.' });
  }

  const content = sanitizeCommentContent(req.body.content);

  if (!content) {
    return res.status(400).json({ message: 'Comment content is required.' });
  }

  if (content.length > 1000) {
    return res.status(400).json({ message: 'Comment cannot exceed 1000 characters.' });
  }

  comment.content = content;
  comment.edited = true;
  comment.editedAt = new Date();
  await comment.save();

  const populatedComment = await populateCommentList(Comment.findById(comment._id));
  res.json(populatedComment);
});

const deleteComment = asyncHandler(async (req, res) => {
  const comment = await Comment.findById(req.params.commentId);

  if (!comment) {
    return res.status(404).json({ message: 'Comment not found.' });
  }

  const post = await Post.findById(comment.post).select('_id author');
  const canDelete = comment.author.toString() === req.user._id.toString() || userCanModerate(req.user, post);

  if (!canDelete) {
    return res.status(403).json({ message: 'You are not allowed to delete this comment.' });
  }

  if (comment.parentComment) {
    await Comment.findByIdAndUpdate(comment.parentComment, {
      $pull: { replies: comment._id }
    });
  } else if (post) {
    await Post.findByIdAndUpdate(post._id, {
      $pull: { comments: comment._id }
    });
  }

  if (comment.replies?.length) {
    await Comment.deleteMany({ _id: { $in: comment.replies } });
  }

  await Comment.findByIdAndDelete(comment._id);

  res.json({
    success: true,
    message: 'Comment deleted successfully.',
    commentId: comment._id
  });
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const comment = await Comment.findById(req.params.commentId);

  if (!comment) {
    return res.status(404).json({ message: 'Comment not found.' });
  }

  const existingLikeIndex = comment.likes.findIndex(
    (like) => like.user.toString() === req.user._id.toString()
  );

  let liked;
  if (existingLikeIndex > -1) {
    comment.likes.splice(existingLikeIndex, 1);
    liked = false;
  } else {
    comment.likes.push({ user: req.user._id });
    liked = true;
  }

  await comment.save();

  res.json({
    success: true,
    liked,
    likeCount: comment.likes.length,
    commentId: comment._id
  });
});

const replyToComment = asyncHandler(async (req, res) => {
  const parentComment = await Comment.findById(req.params.commentId);

  if (!parentComment) {
    return res.status(404).json({ message: 'Comment not found.' });
  }

  const post = await Post.findById(parentComment.post).select('_id');
  if (!post) {
    return res.status(404).json({ message: 'Post not found.' });
  }

  const content = sanitizeCommentContent(req.body.content);
  if (!content) {
    return res.status(400).json({ message: 'Reply content is required.' });
  }

  if (content.length > 1000) {
    return res.status(400).json({ message: 'Reply cannot exceed 1000 characters.' });
  }

  const reply = await Comment.create({
    content,
    author: req.user._id,
    post: post._id,
    parentComment: parentComment._id
  });

  parentComment.replies.push(reply._id);
  await parentComment.save();

  const populatedReply = await populateCommentList(Comment.findById(reply._id));
  res.status(201).json(populatedReply);
});

module.exports = {
  getCommentsByPostSlug,
  createCommentByPostSlug,
  updateComment,
  deleteComment,
  toggleCommentLike,
  replyToComment
};
