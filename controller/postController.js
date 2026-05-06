const Post = require('../models/Post');
const User = require('../models/User');
const Category = require('../models/Category');
const Tag = require('../models/Tag');
const Comment = require('../models/Comment');
const asyncHandler = require('../middleware/asyncHandler');
const { calculateReadingTime } = require('../utils/readingTime');

const SPAM_PATTERNS = ['buy now', 'free money', 'click here', 'cheap deal', 'visit my profile'];

const detectSpam = (content = '') => {
  const normalizedContent = content.trim().toLowerCase();
  const linkMatches = normalizedContent.match(/https?:\/\//g) || [];
  const repeatedCharacterMatch = /(.)\1{7,}/.test(normalizedContent);
  const containsSpamPattern = SPAM_PATTERNS.some((pattern) => normalizedContent.includes(pattern));

  return containsSpamPattern || linkMatches.length > 2 || repeatedCharacterMatch;
};

const canModerateComment = (requestUser, post) => {
  if (!requestUser || !post) return false;
  return requestUser.role === 'admin' || post.author?.toString() === requestUser._id.toString();
};

const canManageCategory = (requestUser, category) => {
  if (!requestUser || !category) return false;
  return requestUser.role === 'admin' || category.createdBy?.toString() === requestUser._id.toString();
};

const getPublishedPosts = asyncHandler(async (req, res) => {
  const searchQuery = req.query.q?.trim();
  const categoryFilter = req.query.category?.trim();
  const tagFilter = req.query.tag?.trim();
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const filter = { status: 'published' };
  const [categoryDoc, tagDoc] = await Promise.all([
    categoryFilter ? Category.findOne({ slug: categoryFilter.toLowerCase() }) : null,
    tagFilter ? Tag.findOne({ slug: tagFilter.toLowerCase() }) : null
  ]);

  if (categoryFilter && !categoryDoc) {
    return res.json({
      posts: [],
      pagination: {
        page,
        limit,
        total: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false
      }
    });
  }

  if (tagFilter && !tagDoc) {
    return res.json({
      posts: [],
      pagination: {
        page,
        limit,
        total: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false
      }
    });
  }

  if (categoryDoc) {
    filter.category = categoryDoc._id;
  }

  if (tagDoc) {
    filter.tags = tagDoc._id;
  }

  let posts;
  let total;

  if (searchQuery) {
    const searchFilter = { ...filter, $text: { $search: searchQuery } };
    total = await Post.countDocuments(searchFilter);
    posts = await Post.find(
      searchFilter,
      { score: { $meta: 'textScore' } }
    )
      .sort({ score: { $meta: 'textScore' } })
      .skip(skip)
      .limit(limit)
      .populate('author', 'username profilePicture')
      .populate('category', 'name color slug')
      .populate('tags', 'name slug');

    if (posts.length === 0) {
      const regexSearch = new RegExp(searchQuery.split(' ').join('|'), 'i');
      const regexFilter = {
        ...filter,
        $or: [
          { title: regexSearch },
          { excerpt: regexSearch },
          { content: regexSearch }
        ]
      };
      total = await Post.countDocuments(regexFilter);
      posts = await Post.find(regexFilter)
        .sort({ publishedAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('author', 'username profilePicture')
        .populate('category', 'name color slug')
        .populate('tags', 'name slug');
    }
  } else {
    total = await Post.countDocuments(filter);
    posts = await Post.find(filter)
      .sort({ publishedAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', 'username profilePicture')
      .populate('category', 'name color slug')
      .populate('tags', 'name slug');
  }

  const totalPages = Math.ceil(total / limit);

  res.json({
    posts,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    }
  });
});

const getPostsByTag = asyncHandler(async (req, res) => {
  const tag = await Tag.findOne({ slug: req.params.slug });

  if (!tag) {
    return res.status(404).json({ message: 'Tag not found' });
  }

  const posts = await Post.find({ tags: tag._id, status: 'published' })
    .sort({ publishedAt: -1 })
    .populate('author', 'username profilePicture')
    .populate('category', 'name color slug')
    .populate('tags', 'name slug');

  res.json({ tag, posts });
});

const getUserPosts = asyncHandler(async (req, res) => {
  const posts = await Post.find({ author: req.user._id })
    .sort({ updatedAt: -1 })
    .populate('category', 'name color slug')
    .populate('tags', 'name slug');

  res.json(posts);
});

const getPostBySlug = asyncHandler(async (req, res) => {
  const post = await Post.findOne({ slug: req.params.slug, status: 'published' })
    .populate('author', 'username profilePicture bio')
    .populate('category', 'name color slug')
    .populate('tags', 'name slug');

  if (!post) {
    return res.status(404).json({ message: 'Post not found' });
  }

  post.views += 1;
  await post.save();

  res.json(post);
});

const getPostsByCategory = asyncHandler(async (req, res) => {
  const category = await Category.findOne({ slug: req.params.slug });

  if (!category) {
    return res.status(404).json({ message: 'Category not found' });
  }

  const posts = await Post.find({ category: category._id, status: 'published' })
    .sort({ publishedAt: -1 })
    .populate('author', 'username profilePicture')
    .populate('category', 'name color slug')
    .populate('tags', 'name slug');

  res.json({ category, posts });
});

const getRelatedPosts = asyncHandler(async (req, res) => {
  const post = await Post.findOne({ slug: req.params.slug, status: 'published' })
    .populate('category', 'name color slug')
    .populate('tags', 'name slug');

  if (!post) {
    return res.status(404).json({ message: 'Post not found' });
  }

  const tagIds = post.tags.map((tag) => tag._id);

  const relatedPosts = await Post.find({
    _id: { $ne: post._id },
    status: 'published',
    $or: [
      { category: post.category._id },
      { tags: { $in: tagIds } }
    ]
  })
    .sort({ publishedAt: -1 })
    .limit(3)
    .populate('author', 'username profilePicture')
    .populate('category', 'name color slug')
    .populate('tags', 'name slug');

  res.json({ relatedPosts });
});

const getAuthorProfileByUsername = asyncHandler(async (req, res) => {
  const author = await User.findOne({ username: req.params.username })
    .populate('followers', 'username profilePicture')
    .populate('following', 'username profilePicture');

  if (!author) {
    return res.status(404).json({ message: 'Author not found' });
  }

  const posts = await Post.find({ author: author._id, status: 'published' })
    .sort({ publishedAt: -1 })
    .populate('category', 'name color slug')
    .populate('tags', 'name slug');

  res.json({
    user: author,
    posts,
    stats: {
      followers: author.followers.length,
      following: author.following.length,
      postCount: posts.length
    }
  });
});

const createPost = asyncHandler(async (req, res) => {
  const { title, content, excerpt, categoryName, tags, status, featuredImage, media } = req.body;
  const trimmedTitle = title?.trim();
  const trimmedContent = content?.trim();
  const trimmedExcerpt = excerpt?.trim() || '';
  const emptyContent = trimmedContent === '<p><br></p>' || trimmedContent === '<div><br></div>';

  if (!trimmedTitle || !trimmedContent || emptyContent) {
    return res.status(400).json({ message: 'Title and content are required.' });
  }

  if (trimmedExcerpt.length > 100000) {
    return res.status(400).json({ message: 'Excerpt cannot exceed 100000 characters.' });
  }

  const categoryLabel = categoryName?.trim() || 'General';
  let category = await Category.findOne({ name: new RegExp(`^${categoryLabel}$`, 'i') });
  if (!category) {
    category = await Category.create({
      name: categoryLabel,
      createdBy: req.user._id
    });
  }

  const tagNames = Array.isArray(tags)
    ? tags
    : (tags || '').split(',').map((tag) => tag.trim()).filter(Boolean);

  const tagDocs = await Promise.all(
    tagNames.map(async (tagName) => {
      let tag = await Tag.findOne({ name: new RegExp(`^${tagName}$`, 'i') });
      if (!tag) {
        tag = await Tag.create({ name: tagName });
      }
      return tag;
    })
  );

  const normalizedMedia = Array.isArray(media)
    ? media
        .filter((item) => item?.url && item?.type)
        .map((item) => ({
          url: item.url,
          type: item.type,
          name: item.name || ''
        }))
    : [];

  const derivedFeaturedImage = featuredImage || normalizedMedia.find((item) => item.type === 'image')?.url || '';

  const readingTime = calculateReadingTime(trimmedContent);

  const post = await Post.create({
    title,
    content,
    excerpt: trimmedExcerpt,
    featuredImage: derivedFeaturedImage,
    media: normalizedMedia,
    author: req.user._id,
    category: category._id,
    tags: tagDocs.map((tag) => tag._id),
    status: status || 'draft',
    readingTime
  });

  if (post.status === 'published') {
    await category.updatePostCount();
  }

  await Promise.all(tagDocs.map((tag) => tag.updatePostCount()));

  res.status(201).json(post);
});

const getPostComments = asyncHandler(async (req, res) => {
  const post = await Post.findOne({ slug: req.params.slug }).select('_id');

  if (!post) {
    return res.status(404).json({ message: 'Post not found' });
  }

  const comments = await Comment.find({
    post: post._id,
    parentComment: null,
    isSpam: false,
    isApproved: true
  })
    .sort({ createdAt: -1 })
    .populate('author', 'username profilePicture');

  res.json(comments);
});

const getCommentsForModeration = asyncHandler(async (req, res) => {
  const post = await Post.findOne({ slug: req.params.slug }).select('_id author');

  if (!post) {
    return res.status(404).json({ message: 'Post not found' });
  }

  if (!canModerateComment(req.user, post)) {
    return res.status(403).json({ message: 'You are not allowed to moderate these comments.' });
  }

  const comments = await Comment.find({ post: post._id, parentComment: null })
    .sort({ createdAt: -1 })
    .populate('author', 'username profilePicture');

  res.json(comments);
});

const createComment = asyncHandler(async (req, res) => {
  const post = await Post.findOne({ slug: req.params.slug }).select('_id');

  if (!post) {
    return res.status(404).json({ message: 'Post not found' });
  }

  const content = req.body.content?.trim();

  if (!content) {
    return res.status(400).json({ message: 'Comment content is required.' });
  }

  if (content.length > 1000) {
    return res.status(400).json({ message: 'Comment cannot exceed 1000 characters.' });
  }

  const isSpam = detectSpam(content);
  const isApproved = !isSpam;

  const comment = await Comment.create({
    content,
    author: req.user._id,
    post: post._id,
    isSpam,
    isApproved
  });

  await Post.findByIdAndUpdate(post._id, {
    $addToSet: { comments: comment._id }
  });

  const populatedComment = await Comment.findById(comment._id).populate('author', 'username profilePicture');

  res.status(201).json({
    ...populatedComment.toObject(),
    moderationMessage: isSpam ? 'Comment is pending moderation because it looks like spam.' : ''
  });
});

const updateComment = asyncHandler(async (req, res) => {
  const post = await Post.findOne({ slug: req.params.slug }).select('_id');

  if (!post) {
    return res.status(404).json({ message: 'Post not found' });
  }

  const comment = await Comment.findOne({
    _id: req.params.commentId,
    post: post._id
  });

  if (!comment) {
    return res.status(404).json({ message: 'Comment not found' });
  }

  if (comment.author.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'You can only edit your own comments.' });
  }

  const content = req.body.content?.trim();

  if (!content) {
    return res.status(400).json({ message: 'Comment content is required.' });
  }

  if (content.length > 1000) {
    return res.status(400).json({ message: 'Comment cannot exceed 1000 characters.' });
  }

  comment.content = content;
  comment.edited = true;
  comment.editedAt = new Date();
  comment.isSpam = detectSpam(content);
  comment.isApproved = !comment.isSpam;
  await comment.save();

  const populatedComment = await Comment.findById(comment._id).populate('author', 'username profilePicture');

  res.json({
    ...populatedComment.toObject(),
    moderationMessage: comment.isSpam ? 'Edited comment is pending moderation because it looks like spam.' : ''
  });
});

const moderateComment = asyncHandler(async (req, res) => {
  const post = await Post.findOne({ slug: req.params.slug }).select('_id author');

  if (!post) {
    return res.status(404).json({ message: 'Post not found' });
  }

  if (!canModerateComment(req.user, post)) {
    return res.status(403).json({ message: 'You are not allowed to moderate this comment.' });
  }

  const comment = await Comment.findOne({
    _id: req.params.commentId,
    post: post._id
  });

  if (!comment) {
    return res.status(404).json({ message: 'Comment not found' });
  }

  const action = req.body.action;

  if (action === 'approve') {
    comment.isApproved = true;
    comment.isSpam = false;
  } else if (action === 'spam') {
    comment.isApproved = false;
    comment.isSpam = true;
  } else if (action === 'reject') {
    comment.isApproved = false;
    comment.isSpam = false;
  } else if (action === 'restore') {
    comment.isApproved = true;
    comment.isSpam = false;
  } else {
    return res.status(400).json({ message: 'Invalid moderation action.' });
  }

  await comment.save();

  const populatedComment = await Comment.findById(comment._id).populate('author', 'username profilePicture');
  res.json(populatedComment);
});

const deleteComment = asyncHandler(async (req, res) => {
  const post = await Post.findOne({ slug: req.params.slug }).select('_id author');

  if (!post) {
    return res.status(404).json({ message: 'Post not found' });
  }

  const comment = await Comment.findOne({
    _id: req.params.commentId,
    post: post._id
  });

  if (!comment) {
    return res.status(404).json({ message: 'Comment not found' });
  }

  const canDeleteComment = comment.author.toString() === req.user._id.toString()
    || canModerateComment(req.user, post);

  if (!canDeleteComment) {
    return res.status(403).json({ message: 'You are not allowed to delete this comment.' });
  }

  await Comment.findByIdAndDelete(comment._id);
  await Post.findByIdAndUpdate(post._id, {
    $pull: { comments: comment._id }
  });

  res.json({ success: true, message: 'Comment deleted successfully.' });
});

const deletePost = asyncHandler(async (req, res) => {
  const post = await Post.findOne({
    _id: req.params.postId,
    author: req.user._id
  });

  if (!post) {
    return res.status(404).json({ message: 'Post not found' });
  }

  const category = post.category ? await Category.findById(post.category) : null;
  const tagDocs = post.tags?.length ? await Tag.find({ _id: { $in: post.tags } }) : [];

  await Comment.deleteMany({ post: post._id });
  await Post.findByIdAndDelete(post._id);

  if (category) {
    await category.updatePostCount();
  }

  await Promise.all(tagDocs.map((tag) => tag.updatePostCount()));

  res.json({
    message: 'Post deleted successfully',
    postId: post._id
  });
});

const getCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find().sort({ name: 1 });

  if (categories.length === 0) {
    const defaultCategories = [
      { name: 'Technology', color: '#10B981', icon: '💻', createdBy: req.user?._id },
      { name: 'Lifestyle', color: '#F59E0B', icon: '🌿', createdBy: req.user?._id },
      { name: 'Travel', color: '#EF4444', icon: '✈️', createdBy: req.user?._id },
      { name: 'Business', color: '#3B82F6', icon: '📈', createdBy: req.user?._id }
    ];
    const created = await Category.insertMany(defaultCategories);
    return res.json(created);
  }

  res.json(categories);
});

const getTags = asyncHandler(async (req, res) => {
  const tags = await Tag.find().sort({ postCount: -1, name: 1 });
  res.json(tags);
});

const createCategory = asyncHandler(async (req, res) => {
  const name = req.body.name?.trim();
  const description = req.body.description?.trim() || '';
  const color = req.body.color?.trim() || '#3B82F6';
  const icon = req.body.icon?.trim() || '📝';

  if (!name) {
    return res.status(400).json({ message: 'Category name is required.' });
  }

  const existingCategory = await Category.findOne({ name: new RegExp(`^${name}$`, 'i') });
  if (existingCategory) {
    return res.status(400).json({ message: 'Category already exists.' });
  }

  const category = await Category.create({
    name,
    description,
    color,
    icon,
    createdBy: req.user._id
  });

  res.status(201).json(category);
});

const updateCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.categoryId);

  if (!category) {
    return res.status(404).json({ message: 'Category not found.' });
  }

  if (!canManageCategory(req.user, category)) {
    return res.status(403).json({ message: 'You are not allowed to edit this category.' });
  }

  const nextName = req.body.name?.trim();

  if (nextName && nextName.toLowerCase() !== category.name.toLowerCase()) {
    const existingCategory = await Category.findOne({
      name: new RegExp(`^${nextName}$`, 'i'),
      _id: { $ne: category._id }
    });

    if (existingCategory) {
      return res.status(400).json({ message: 'Category already exists.' });
    }

    category.name = nextName;
  }

  if (req.body.description !== undefined) category.description = req.body.description.trim();
  if (req.body.color !== undefined) category.color = req.body.color.trim() || category.color;
  if (req.body.icon !== undefined) category.icon = req.body.icon.trim() || category.icon;

  await category.save();

  res.json(category);
});

const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.categoryId);

  if (!category) {
    return res.status(404).json({ message: 'Category not found.' });
  }

  if (!canManageCategory(req.user, category)) {
    return res.status(403).json({ message: 'You are not allowed to delete this category.' });
  }

  const publishedPostsCount = await Post.countDocuments({
    category: category._id,
    status: 'published'
  });

  if (publishedPostsCount > 0) {
    return res.status(400).json({ message: 'Cannot delete a category that still has published posts.' });
  }

  await Category.findByIdAndDelete(category._id);
  res.json({ message: 'Category deleted successfully.', categoryId: category._id });
});

module.exports = {
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
};
