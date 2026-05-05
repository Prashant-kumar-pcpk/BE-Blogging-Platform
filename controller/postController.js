const Post = require('../models/Post');
const Category = require('../models/Category');
const Tag = require('../models/Tag');
const Comment = require('../models/Comment');
const asyncHandler = require('../middleware/asyncHandler');

const getPublishedPosts = asyncHandler(async (req, res) => {
  const posts = await Post.find({ status: 'published' })
    .sort({ publishedAt: -1 })
    .populate('author', 'username profilePicture')
    .populate('category', 'name color slug')
    .populate('tags', 'name slug');

  res.json(posts);
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

const createPost = asyncHandler(async (req, res) => {
  const { title, content, excerpt, categoryName, tags, status, featuredImage, media } = req.body;
  const trimmedTitle = title?.trim();
  const trimmedContent = content?.trim();
  const emptyContent = trimmedContent === '<p><br></p>' || trimmedContent === '<div><br></div>';

  if (!trimmedTitle || !trimmedContent || emptyContent) {
    return res.status(400).json({ message: 'Title and content are required.' });
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

  const post = await Post.create({
    title,
    content,
    excerpt,
    featuredImage: derivedFeaturedImage,
    media: normalizedMedia,
    author: req.user._id,
    category: category._id,
    tags: tagDocs.map((tag) => tag._id),
    status: status || 'draft'
  });

  if (post.status === 'published') {
    await category.updatePostCount();
  }

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

const createComment = asyncHandler(async (req, res) => {
  const post = await Post.findOne({ slug: req.params.slug }).select('_id');

  if (!post) {
    return res.status(404).json({ message: 'Post not found' });
  }

  const content = req.body.content?.trim();

  if (!content) {
    return res.status(400).json({ message: 'Comment content is required.' });
  }

  const comment = await Comment.create({
    content,
    author: req.user._id,
    post: post._id
  });

  await Post.findByIdAndUpdate(post._id, {
    $addToSet: { comments: comment._id }
  });

  const populatedComment = await Comment.findById(comment._id).populate('author', 'username profilePicture');

  res.status(201).json(populatedComment);
});

const deleteComment = asyncHandler(async (req, res) => {
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
    return res.status(403).json({ message: 'You can only delete your own comments.' });
  }

  await Comment.findByIdAndDelete(comment._id);
  await Post.findByIdAndUpdate(post._id, {
    $pull: { comments: comment._id }
  });

  res.json({ success: true, message: 'Comment deleted successfully.' });
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

module.exports = {
  getPublishedPosts,
  getUserPosts,
  getPostBySlug,
  getPostsByCategory,
  createPost,
  getCategories,
  getPostComments,
  createComment,
  deleteComment
};
