const User = require('../models/User');
const Category = require('../models/Category');
const { generateToken, generateRefreshToken } = require('../utils/auth');
const asyncHandler = require('../middleware/asyncHandler');

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
const register = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;

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
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      },
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
  const { email, password } = req.body;

  // Check for user
  const user = await User.findOne({ email }).select('+password');

  if (user && (await user.comparePassword(password))) {
    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    res.json({
      message: 'Login successful',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        bio: user.bio,
        profilePicture: user.profilePicture
      },
      token,
      refreshToken
    });
  } else {
    res.status(401).json({ message: 'Invalid email or password' });
  }
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
  if (username) updateData.username = username;
  if (bio !== undefined) updateData.bio = bio;
  if (profilePicture !== undefined) updateData.profilePicture = profilePicture;
  if (socialLinks) updateData.socialLinks = socialLinks;

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

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

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
  getProfile,
  updateProfile,
  changePassword,
  resetPassword,
  followUser,
  unfollowUser
};
