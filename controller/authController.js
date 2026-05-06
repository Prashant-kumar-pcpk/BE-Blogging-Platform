const User = require('../models/User');
const Category = require('../models/Category');
const Comment = require('../models/Comment');
const Post = require('../models/Post');
const { generateToken, generateRefreshToken, verifyRefreshToken } = require('../utils/auth');
const asyncHandler = require('../middleware/asyncHandler');

const isValidEmail = (email = '') => /\S+@\S+\.\S+/.test(email);
const isStrongPassword = (password = '') =>
  password.length >= 8
  && /[A-Z]/.test(password)
  && /[a-z]/.test(password)
  && /\d/.test(password);

const sanitizeAuthUser = (user) => ({
  id: user._id,
  username: user.username,
  email: user.email,
  role: user.role,
  bio: user.bio,
  profilePicture: user.profilePicture,
  socialLinks: user.socialLinks
});

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
const register = asyncHandler(async (req, res) => {
  const username = req.body.username?.trim();
  const email = req.body.email?.trim().toLowerCase();
  const password = req.body.password || '';

  if (!username || !email || !password) {
    return res.status(400).json({ message: 'Username, email, and password are required.' });
  }

  if (username.length < 3) {
    return res.status(400).json({ message: 'Username must be at least 3 characters long.' });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({ message: 'Please enter a valid email address.' });
  }

  if (!isStrongPassword(password)) {
    return res.status(400).json({
      message: 'Password must be at least 8 characters and include uppercase, lowercase, and a number.'
    });
  }

  // Check if user exists
  const userExists = await User.findOne({
    $or: [{ email }, { username }]
  });

  if (userExists) {
    return res.status(400).json({
      message: userExists.email === email ? 'Email already registered' : 'Username already taken'
    });
  }

  // Create user
  const user = await User.create({
    username,
    email,
    password
  });

  if (user) {
    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    res.status(201).json({
      message: 'User registered successfully',
      user: sanitizeAuthUser(user),
      token,
      refreshToken
    });
  } else {
    res.status(400).json({ message: 'Invalid user data' });
  }
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = asyncHandler(async (req, res) => {
  const email = req.body.email?.trim().toLowerCase();
  const password = req.body.password || '';

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  // Check for user
  const user = await User.findOne({ email }).select('+password');

  if (user && (await user.comparePassword(password))) {
    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    res.json({
      message: 'Login successful',
      user: sanitizeAuthUser(user),
      token,
      refreshToken
    });
  } else {
    res.status(401).json({ message: 'Invalid email or password' });
  }
});

// @desc    Refresh access token
// @route   POST /api/auth/refresh
// @access  Public
const refreshSession = asyncHandler(async (req, res) => {
  const refreshToken = req.body.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({ message: 'Refresh token is required.' });
  }

  let decoded;
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired refresh token.' });
  }

  const user = await User.findById(decoded.userId);

  if (!user) {
    return res.status(401).json({ message: 'User no longer exists.' });
  }

  res.json({
    token: generateToken(user._id),
    refreshToken: generateRefreshToken(user._id),
    user: sanitizeAuthUser(user)
  });
});

// @desc    Get current user profile
// @route   GET /api/auth/profile
// @access  Private
const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
    .populate('followers', 'username profilePicture')
    .populate('following', 'username profilePicture')
    .populate('subscribedCategories', 'name slug color');

  res.json(user);
});

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = asyncHandler(async (req, res) => {
  const { username, bio, profilePicture, socialLinks } = req.body;

  const updateData = {};
  const trimmedUsername = username?.trim();

  if (trimmedUsername) {
    const existingUser = await User.findOne({
      username: trimmedUsername,
      _id: { $ne: req.user._id }
    });

    if (existingUser) {
      return res.status(400).json({ message: 'Username already taken' });
    }

    updateData.username = trimmedUsername;
  }

  if (bio !== undefined) updateData.bio = bio.trim();
  if (profilePicture !== undefined) updateData.profilePicture = profilePicture;
  if (socialLinks) {
    updateData.socialLinks = {
      twitter: socialLinks.twitter?.trim() || '',
      linkedin: socialLinks.linkedin?.trim() || '',
      github: socialLinks.github?.trim() || '',
      website: socialLinks.website?.trim() || ''
    };
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    updateData,
    { new: true, runValidators: true }
  ).populate('followers', 'username profilePicture')
   .populate('following', 'username profilePicture')
   .populate('subscribedCategories', 'name slug color');

  res.json({
    message: 'Profile updated successfully',
    user
  });
});

// @desc    Get current user's comments
// @route   GET /api/auth/comments
// @access  Private
const getMyComments = asyncHandler(async (req, res) => {
  const comments = await Comment.find({ author: req.user._id })
    .sort({ createdAt: -1 })
    .populate({
      path: 'post',
      select: 'title slug status'
    });

  res.json(comments);
});

// @desc    Delete current user's comment
// @route   DELETE /api/auth/comments/:commentId
// @access  Private
const deleteMyComment = asyncHandler(async (req, res) => {
  const comment = await Comment.findOne({
    _id: req.params.commentId,
    author: req.user._id
  });

  if (!comment) {
    return res.status(404).json({ message: 'Comment not found' });
  }

  await Post.findByIdAndUpdate(comment.post, {
    $pull: { comments: comment._id }
  });
  await Comment.findByIdAndDelete(comment._id);

  res.json({
    message: 'Comment deleted successfully',
    commentId: comment._id
  });
});

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Current password and new password are required.' });
  }

  if (!isStrongPassword(newPassword)) {
    return res.status(400).json({
      message: 'New password must be at least 8 characters and include uppercase, lowercase, and a number.'
    });
  }

  const user = await User.findById(req.user._id).select('+password');

  if (!(await user.comparePassword(currentPassword))) {
    return res.status(400).json({ message: 'Current password is incorrect' });
  }

  user.password = newPassword;
  await user.save();

  res.json({ message: 'Password changed successfully' });
});

// @desc    Reset password by email
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = asyncHandler(async (req, res) => {
  const { email, newPassword } = req.body;

  const normalizedEmail = email?.trim().toLowerCase();

  if (!normalizedEmail || !newPassword) {
    return res.status(400).json({ message: 'Email and new password are required' });
  }

  if (!isValidEmail(normalizedEmail)) {
    return res.status(400).json({ message: 'Please enter a valid email address.' });
  }

  if (!isStrongPassword(newPassword)) {
    return res.status(400).json({
      message: 'New password must be at least 8 characters and include uppercase, lowercase, and a number.'
    });
  }

  const user = await User.findOne({ email: normalizedEmail }).select('+password');

  if (!user) {
    return res.status(404).json({ message: 'No account found for this email address' });
  }

  user.password = newPassword;
  await user.save();

  res.json({ message: 'Password reset successfully. Please sign in with your new password.' });
});

// @desc    Follow user
// @route   POST /api/auth/follow/:userId
// @access  Private
const followUser = asyncHandler(async (req, res) => {
  const userToFollow = await User.findById(req.params.userId);

  if (!userToFollow) {
    return res.status(404).json({ message: 'User not found' });
  }

  if (req.user._id.toString() === req.params.userId) {
    return res.status(400).json({ message: 'Cannot follow yourself' });
  }

  // Check if already following
  if (req.user.following.includes(req.params.userId)) {
    return res.status(400).json({ message: 'Already following this user' });
  }

  // Add to following list
  req.user.following.push(req.params.userId);
  await req.user.save();

  // Add to followers list
  userToFollow.followers.push(req.user._id);
  await userToFollow.save();

  res.json({ message: 'User followed successfully' });
});

// @desc    Unfollow user
// @route   DELETE /api/auth/follow/:userId
// @access  Private
const unfollowUser = asyncHandler(async (req, res) => {
  const userToUnfollow = await User.findById(req.params.userId);

  if (!userToUnfollow) {
    return res.status(404).json({ message: 'User not found' });
  }

  // Remove from following list
  req.user.following = req.user.following.filter(
    id => id.toString() !== req.params.userId
  );
  await req.user.save();

  // Remove from followers list
  userToUnfollow.followers = userToUnfollow.followers.filter(
    id => id.toString() !== req.user._id.toString()
  );
  await userToUnfollow.save();

  res.json({ message: 'User unfollowed successfully' });
});

module.exports = {
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
};
