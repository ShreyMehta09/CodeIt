const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
require('dotenv').config();

const createAdminUser = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/codolio-clone');
    console.log('Connected to MongoDB');

    // Check if admin user already exists
    const existingAdmin = await User.findOne({ username: 'admin' });
    if (existingAdmin) {
      console.log('Admin user already exists');
      console.log('Admin user details:', {
        username: existingAdmin.username,
        email: existingAdmin.email,
        role: existingAdmin.role
      });
      
      // Set password (this will trigger the hashing middleware)
      existingAdmin.password = 'admin123';
      existingAdmin.role = 'admin';
      await existingAdmin.save();
      console.log('✅ Updated admin user password and role');
      
      // Test the password
      const testMatch = await existingAdmin.comparePassword('admin123');
      console.log('Password verification:', testMatch ? '✅ CORRECT' : '❌ STILL WRONG');
      
      await mongoose.connection.close();
      return;
    }

    // Hash the password - let mongoose middleware handle this
    // const hashedPassword = await bcrypt.hash('admin123', 12);

    // Create admin user
    const adminUser = new User({
      name: 'Administrator',
      username: 'admin',
      email: 'admin@codeit.com',
      password: 'admin123', // Let mongoose hash this
      role: 'admin',
      isEmailVerified: true,
      profileData: {
        bio: 'System Administrator',
        location: 'System',
        website: ''
      },
      socialLinks: {},
      preferences: {
        emailNotifications: false,
        pushNotifications: false,
        weeklyDigest: false
      },
      privacy: {
        profileVisibility: 'private',
        showEmail: false,
        showSocialLinks: false
      }
    });

    await adminUser.save();
    console.log('✅ Admin user created successfully!');
    console.log('Admin login credentials:');
    console.log('Username: admin');
    console.log('Password: admin123');
    console.log('Email: admin@codeit.com');
    console.log('Role: admin');

  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
};

createAdminUser();