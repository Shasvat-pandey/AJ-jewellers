// Run this script to set the logo in StoreSettings
// Usage: node set-logo.js

const mongoose = require('mongoose');
require('dotenv').config();

async function updateLogo() {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/ajjewellers';
    console.log('Connecting to:', uri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'));
    
    await mongoose.connect(uri);
    console.log('✅ Connected to MongoDB');
    
    const StoreSettings = require('./models/StoreSettings');
    
    let settings = await StoreSettings.findOne();
    if (settings) {
      settings.businessInfo.logo = 'uploads/1789488741289-292478787.jpg';
      await settings.save();
      console.log('✅ Logo updated successfully');
      console.log('Business Info:', JSON.stringify(settings.businessInfo, null, 2));
    } else {
      console.log('No settings found, creating default...');
      settings = await StoreSettings.create({
        businessInfo: {
          logo: 'uploads/1789488741289-292478787.jpg'
        }
      });
      console.log('✅ Default settings created with logo');
      console.log('Business Info:', JSON.stringify(settings.businessInfo, null, 2));
    }
  } catch (err) {
    console.error('❌ Error:', err.message);
    if (err.message.includes('ECONNREFUSED') || err.message.includes('querySrv')) {
      console.log('\n💡 Could not connect to MongoDB Atlas.');
      console.log('   Make sure your IP is whitelisted in MongoDB Atlas Network Access.');
      console.log('   Or run this script from a machine with network access.');
    }
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected');
    process.exit(0);
  }
}

updateLogo();