const mongoose = require('mongoose');

const sheetSchema = new mongoose.Schema({
  // Basic Info
  name: {
    type: String,
    required: true,
    maxlength: 100
  },
  description: {
    type: String,
    maxlength: 500
  },
  
  // Owner
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Visibility
  isPublic: {
    type: Boolean,
    default: false
  },
  
  // Admin-created sheets (visible to all users)
  isGlobal: {
    type: Boolean,
    default: false
  },
  createdByAdmin: {
    type: Boolean,
    default: false
  },
  
  // Problems in the sheet
  problems: [{
    problemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Problem',
      required: true
    },
    addedAt: {
      type: Date,
      default: Date.now
    },
    order: {
      type: Number,
      default: 0
    }
  }],
  
  // Categories/Tags
  category: {
    type: String,
    enum: ['dsa', 'algorithms', 'data-structures', 'dynamic-programming', 'graphs', 'trees', 'arrays', 'strings', 'math', 'greedy', 'backtracking', 'contest', 'interview', 'custom'],
    default: 'custom'
  },
  
  tags: [{
    type: String,
    lowercase: true
  }],
  
  // Progress tracking
  totalProblems: {
    type: Number,
    default: 0
  },
  solvedProblems: {
    type: Number,
    default: 0
  },
  
  // Difficulty distribution
  difficultyDistribution: {
    easy: { type: Number, default: 0 },
    medium: { type: Number, default: 0 },
    hard: { type: Number, default: 0 }
  },
  
  // Template sheets (predefined popular sheets)
  isTemplate: {
    type: Boolean,
    default: false
  },
  templateSource: {
    type: String, // e.g., 'striver-a2z', 'blind-75', 'neetcode-150'
  },
  
  // Stats
  stats: {
    views: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    forks: { type: Number, default: 0 }
  },
  
  // Sharing
  shareCode: {
    type: String
  }
}, {
  timestamps: true
});

// Indexes
sheetSchema.index({ userId: 1 });
sheetSchema.index({ isPublic: 1, category: 1 });
sheetSchema.index({ shareCode: 1 }, { unique: true, sparse: true });
sheetSchema.index({ isTemplate: 1 });
sheetSchema.index({ userId: 1, name: 1 });

// Generate share code before saving
sheetSchema.pre('save', function(next) {
  if (this.isNew && this.isPublic && !this.shareCode) {
    this.shareCode = Math.random().toString(36).substr(2, 8);
  }
  next();
});

// Update progress when problems are modified
sheetSchema.methods.updateProgress = async function() {
  const Problem = mongoose.model('Problem');
  
  // Get all problems in this sheet with their status
  const problemsWithStatus = await Problem.find({
    _id: { $in: this.problems.map(p => p.problemId) },
    userId: this.userId
  });
  
  this.totalProblems = problemsWithStatus.length;
  this.solvedProblems = problemsWithStatus.filter(p => p.status === 'solved').length;
  
  // Update difficulty distribution
  this.difficultyDistribution = {
    easy: problemsWithStatus.filter(p => p.difficulty === 'easy').length,
    medium: problemsWithStatus.filter(p => p.difficulty === 'medium').length,
    hard: problemsWithStatus.filter(p => p.difficulty === 'hard').length
  };
  
  await this.save();
};

// Static method to get popular templates
sheetSchema.statics.getTemplates = async function() {
  return this.find({ isTemplate: true }).select('name description category totalProblems difficultyDistribution templateSource');
};

// Virtual for progress percentage
sheetSchema.virtual('progressPercentage').get(function() {
  if (this.totalProblems === 0) return 0;
  return Math.round((this.solvedProblems / this.totalProblems) * 100);
});

// Virtual for public URL
sheetSchema.virtual('publicUrl').get(function() {
  return this.shareCode ? `/sheet/${this.shareCode}` : null;
});

module.exports = mongoose.model('Sheet', sheetSchema);