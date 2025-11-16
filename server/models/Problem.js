const mongoose = require('mongoose');

const problemSchema = new mongoose.Schema({
  // Problem Info
  title: {
    type: String,
    required: true
  },
  platform: {
    type: String,
    required: true,
    enum: ['leetcode', 'codeforces', 'codechef', 'atcoder', 'custom']
  },
  problemId: {
    type: String,
    required: true
  },
  url: {
    type: String,
    required: true
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard', 'div1', 'div2', 'div3', 'beginner', 'regular', 'expert'],
    required: true
  },
  
  // User-specific data
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Admin-created problems (visible to all users)
  isGlobal: {
    type: Boolean,
    default: false
  },
  createdByAdmin: {
    type: Boolean,
    default: false
  },
  
  // Status
  status: {
    type: String,
    enum: ['todo', 'solved', 'attempted', 'review'],
    default: 'todo'
  },
  
  // Tags
  tags: [{
    type: String,
    lowercase: true
  }],
  
  // Custom fields
  notes: {
    type: String,
    maxlength: 2000
  },
  solution: {
    type: String,
    maxlength: 10000
  },
  timeComplexity: String,
  spaceComplexity: String,
  
  // Tracking
  attempts: {
    type: Number,
    default: 0
  },
  solvedAt: Date,
  lastAttemptAt: Date,
  
  // Rating/Contest info (for competitive programming)
  rating: Number,
  contestId: String,
  contestName: String,
  
  // Priority
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  
  // Custom tags by user
  customTags: [{
    type: String,
    lowercase: true
  }]
}, {
  timestamps: true
});

// Indexes
problemSchema.index({ userId: 1, platform: 1 });
problemSchema.index({ userId: 1, status: 1 });
problemSchema.index({ userId: 1, difficulty: 1 });
problemSchema.index({ userId: 1, tags: 1 });
problemSchema.index({ platform: 1, problemId: 1 });
problemSchema.index({ userId: 1, solvedAt: -1 });

// Compound index for unique problems per user
problemSchema.index({ userId: 1, platform: 1, problemId: 1 }, { unique: true });

// Update solvedAt when status changes to solved
problemSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status === 'solved' && !this.solvedAt) {
    this.solvedAt = new Date();
  }
  next();
});

// Static method to get user stats
problemSchema.statics.getUserStats = async function(userId) {
  const stats = await this.aggregate([
    { $match: { userId: mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: null,
        totalProblems: { $sum: 1 },
        solvedCount: {
          $sum: { $cond: [{ $eq: ['$status', 'solved'] }, 1, 0] }
        },
        easyCount: {
          $sum: { 
            $cond: [
              { $and: [{ $eq: ['$difficulty', 'easy'] }, { $eq: ['$status', 'solved'] }] }, 
              1, 0
            ] 
          }
        },
        mediumCount: {
          $sum: { 
            $cond: [
              { $and: [{ $eq: ['$difficulty', 'medium'] }, { $eq: ['$status', 'solved'] }] }, 
              1, 0
            ] 
          }
        },
        hardCount: {
          $sum: { 
            $cond: [
              { $and: [{ $eq: ['$difficulty', 'hard'] }, { $eq: ['$status', 'solved'] }] }, 
              1, 0
            ] 
          }
        }
      }
    }
  ]);
  
  return stats[0] || {
    totalProblems: 0,
    solvedCount: 0,
    easyCount: 0,
    mediumCount: 0,
    hardCount: 0
  };
};

module.exports = mongoose.model('Problem', problemSchema);