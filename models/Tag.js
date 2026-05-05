const mongoose = require('mongoose');

const tagSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Tag name is required'],
    unique: true,
    trim: true,
    lowercase: true,
    maxlength: [30, 'Tag name cannot exceed 30 characters']
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true,
    trim: true
  },
  color: {
    type: String,
    default: '#10B981' // Default green color
  },
  postCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Create slug from name before saving
tagSchema.pre('save', async function() {
  if (this.isModified('name')) {
    this.slug = this.name
      .replace(/[^a-zA-Z0-9 ]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }
});

// Update post count when posts are added/removed
tagSchema.methods.updatePostCount = async function() {
  const Post = mongoose.model('Post');
  this.postCount = await Post.countDocuments({
    tags: this._id,
    status: 'published'
  });
  await this.save();
};

module.exports = mongoose.model('Tag', tagSchema);