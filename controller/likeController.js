const Post = require('../models/Post');
const asyncHandler = require('../middleware/asyncHandler');

// Toggle like on a post
const toggleLike = asyncHandler(async (req, res) => {
  const { slug } = req.params;
  const userId = req.user._id;

  const post = await Post.findOne({ slug });
  if (!post) {
    return res.status(404).json({ message: 'Post not found.' });
  }

  // Check if user has already liked this post
  const likeIndex = post.likes.findIndex(
    (like) => like.user.toString() === userId.toString()
  );

  if (likeIndex > -1) {
    // Remove like
    post.likes.splice(likeIndex, 1);
  } else {
    // Add like
    post.likes.push({
      user: userId,
      createdAt: new Date()
    });
  }

  await post.save();

  const liked = likeIndex === -1;
  const likeCount = post.likes.length;

  res.json({
    message: liked ? 'Post liked.' : 'Like removed.',
    liked,
    likeCount
  });
});

// Get post likes count
const getLikes = asyncHandler(async (req, res) => {
  const { slug } = req.params;

  const post = await Post.findOne({ slug }).select('likes');
  if (!post) {
    return res.status(404).json({ message: 'Post not found.' });
  }

  res.json({
    likeCount: post.likes.length,
    likes: post.likes
  });
});

// Check if user liked a post
const isPostLiked = asyncHandler(async (req, res) => {
  const { slug } = req.params;
  const userId = req.user._id;

  const post = await Post.findOne({ slug }).select('likes');
  if (!post) {
    return res.status(404).json({ message: 'Post not found.' });
  }

  const isLiked = post.likes.some(
    (like) => like.user.toString() === userId.toString()
  );

  res.json({
    isLiked,
    likeCount: post.likes.length
  });
});

module.exports = {
  toggleLike,
  getLikes,
  isPostLiked
};
