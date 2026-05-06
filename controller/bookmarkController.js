const User = require('../models/User');
const Post = require('../models/Post');
const asyncHandler = require('../middleware/asyncHandler');

// Get user bookmarks
const getBookmarks = asyncHandler(async (req, res) => {
  const bookmarks = await User.findById(req.user._id)
    .populate({
      path: 'bookmarks',
      populate: [
        { path: 'author', select: 'username profilePicture' },
        { path: 'category', select: 'name color slug' },
        { path: 'tags', select: 'name slug' }
      ]
    })
    .select('bookmarks');

  res.json(bookmarks.bookmarks || []);
});

// Add bookmark
const addBookmark = asyncHandler(async (req, res) => {
  const { postId } = req.body;

  if (!postId) {
    return res.status(400).json({ message: 'Post ID is required.' });
  }

  const post = await Post.findById(postId);
  if (!post) {
    return res.status(404).json({ message: 'Post not found.' });
  }

  const user = await User.findById(req.user._id);

  if (user.bookmarks.includes(postId)) {
    return res.status(400).json({ message: 'Post is already bookmarked.' });
  }

  user.bookmarks.push(postId);
  await user.save();

  res.json({ message: 'Post bookmarked successfully.', bookmarked: true });
});

// Remove bookmark
const removeBookmark = asyncHandler(async (req, res) => {
  const { postId } = req.body;

  if (!postId) {
    return res.status(400).json({ message: 'Post ID is required.' });
  }

  const user = await User.findById(req.user._id);

  if (!user.bookmarks.includes(postId)) {
    return res.status(400).json({ message: 'Post is not bookmarked.' });
  }

  user.bookmarks = user.bookmarks.filter((id) => id.toString() !== postId);
  await user.save();

  res.json({ message: 'Bookmark removed successfully.', bookmarked: false });
});

// Check if post is bookmarked
const isPostBookmarked = asyncHandler(async (req, res) => {
  const { postId } = req.params;

  const user = await User.findById(req.user._id);

  const isBookmarked = user.bookmarks.includes(postId);

  res.json({ isBookmarked });
});

module.exports = {
  getBookmarks,
  addBookmark,
  removeBookmark,
  isPostBookmarked
};
