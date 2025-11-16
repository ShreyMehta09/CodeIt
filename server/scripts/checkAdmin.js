const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const checkAdminUser = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/codolio-clone');
    console.log('Connected to MongoDB');

    // Find admin user by the ID shown in logs
    const admin = await User.findById('68d2f6e67d73a7848f04d6c5');
    if (admin) {
      console.log('✅ Admin user found by ID:');
      console.log('ID:', admin._id);
      console.log('Username:', admin.username);
      console.log('Email:', admin.email);
      console.log('Role:', admin.role);
      console.log('Name:', admin.name);
    } else {
      console.log('❌ Admin user not found by ID');
    }

    // Also check by username
    const adminByUsername = await User.findOne({ username: 'admin' });
    if (adminByUsername) {
      console.log('\n✅ Admin user found by username "admin":');
      console.log('ID:', adminByUsername._id);
      console.log('Username:', adminByUsername.username);
      console.log('Email:', adminByUsername.email);
      console.log('Role:', adminByUsername.role);
    } else {
      console.log('\n❌ No user found with username "admin"');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
};

checkAdminUser();