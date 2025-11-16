const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // Basic Info
  email: {
    type: String,
    required: true,
    lowercase: true
  },
  password: {
    type: String,
    required: function() {
      return !this.googleId; // Password required only if not Google OAuth
    }
  },
  name: {
    type: String,
    required: true
  },
  username: {
    type: String
  },
  avatar: {
    type: String,
    default: ''
  },
  
  // OAuth
  googleId: {
    type: String
  },
  
  // User Role
  role: {
    type: String,
    enum: ['user', 'teacher', 'admin'],
    default: 'user'
  },
  
  // Profile Settings
  isPublic: {
    type: Boolean,
    default: true
  },
  bio: {
    type: String,
    maxlength: 500
  },
  location: {
    type: String,
    maxlength: 100
  },
  website: {
    type: String
  },
  
  // Platform Handles
  platforms: {
    leetcode: {
      handle: String,
      lastSynced: Date,
      isConnected: { type: Boolean, default: false },
      verificationCode: String,
      verificationExpiry: Date,
      cachedData: {
        type: mongoose.Schema.Types.Mixed,
        default: null
      }
    },
    codeforces: {
      handle: String,
      lastSynced: Date,
      isConnected: { type: Boolean, default: false },
      verificationCode: String,
      verificationExpiry: Date,
      cachedData: {
        type: mongoose.Schema.Types.Mixed,
        default: null
      }
    },
    codechef: {
      handle: String,
      lastSynced: Date,
      isConnected: { type: Boolean, default: false },
      verificationCode: String,
      verificationExpiry: Date,
      cachedData: {
        type: mongoose.Schema.Types.Mixed,
        default: null
      }
    },
    atcoder: {
      handle: String,
      lastSynced: Date,
      isConnected: { type: Boolean, default: false },
      verificationCode: String,
      verificationExpiry: Date,
      cachedData: {
        type: mongoose.Schema.Types.Mixed,
        default: null
      }
    },
    github: {
      handle: String,
      lastSynced: Date,
      isConnected: { type: Boolean, default: false },
      verificationCode: String,
      verificationExpiry: Date,
      cachedData: {
        type: mongoose.Schema.Types.Mixed,
        default: null
      }
    }
  },
  
  // Stats
  stats: {
    totalSolved: { type: Number, default: 0 },
    currentStreak: { type: Number, default: 0 },
    maxStreak: { type: Number, default: 0 },
    lastSolvedDate: Date,
    solvedByDifficulty: {
      easy: { type: Number, default: 0 },
      medium: { type: Number, default: 0 },
      hard: { type: Number, default: 0 }
    },
    solvedByPlatform: {
      leetcode: { type: Number, default: 0 },
      codeforces: { type: Number, default: 0 },
      codechef: { type: Number, default: 0 },
      atcoder: { type: Number, default: 0 }
    }
  },
  
  // Badges
  badges: [{
    name: String,
    description: String,
    icon: String,
    earnedAt: { type: Date, default: Date.now }
  }],
  
  // Social Links
  socialLinks: {
    twitter: String,
    linkedin: String,
    github: String,
    portfolio: String,
    blog: String
  },
  
  // Settings
  settings: {
    emailNotifications: {
      general: { type: Boolean, default: true },
      weeklyReports: { type: Boolean, default: true },
      platformUpdates: { type: Boolean, default: true },
      achievements: { type: Boolean, default: true },
      reminders: { type: Boolean, default: false }
    },
    privacy: {
      profileVisibility: { type: String, enum: ['public', 'private', 'friends'], default: 'public' },
      showStats: { type: Boolean, default: true },
      showBadges: { type: Boolean, default: true },
      showSocialLinks: { type: Boolean, default: true }
    },
    theme: { type: String, enum: ['light', 'dark', 'auto'], default: 'auto' }
  }
}, {
  timestamps: true
});

// Indexes
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ username: 1 }, { unique: true, sparse: true });
userSchema.index({ googleId: 1 }, { sparse: true });
userSchema.index({ 'platforms.leetcode.handle': 1 });
userSchema.index({ 'platforms.codeforces.handle': 1 });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

// Generate username from email if not provided
userSchema.pre('save', function(next) {
  if (!this.username && this.email) {
    this.username = this.email.split('@')[0] + '_' + Math.random().toString(36).substr(2, 4);
  }
  next();
});

// Virtual for public profile URL
userSchema.virtual('profileUrl').get(function() {
  return `/profile/${this.username}`;
});

// Transform output
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  delete user.googleId;
  return user;
};

module.exports = mongoose.model('User', userSchema);