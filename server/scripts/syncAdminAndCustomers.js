const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Admin = require('../models/Admin');
const Customer = require('../models/Customer');
const User = require('../models/User');

async function syncCollections() {
  try {
    if (!process.env.MONGODB_URI) {
      console.error('❌ MONGODB_URI not found in server/.env');
      process.exit(1);
    }

    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected successfully.');

    const adminEmail = 'admin@aj.com';

    // 1. Find all users in the unified users collection
    const allUsers = await User.find({});
    console.log(`Found ${allUsers.length} total user records in 'users' collection.`);

    // 2. Ensure admin@aj.com is admin
    let adminRecord = await User.findOne({ email: adminEmail });
    if (!adminRecord) {
      console.log(`Creating default admin: ${adminEmail}`);
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);
      adminRecord = await User.create({
        name: 'Super Admin',
        email: adminEmail,
        password: hashedPassword,
        phone: '9876543210',
        role: 'admin',
        status: 'Active'
      });
    } else {
      adminRecord.role = 'admin';
      adminRecord.status = 'Active';
      await adminRecord.save();
    }

    // 3. Upsert admin@aj.com into admins collection
    await Admin.findOneAndUpdate(
      { email: adminEmail },
      {
        _id: adminRecord._id,
        name: adminRecord.name || 'Super Admin',
        email: adminEmail,
        password: adminRecord.password,
        phone: adminRecord.phone || '',
        role: 'admin',
        status: 'Active'
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    console.log(`✅ Ensured '${adminEmail}' is present in 'admins' collection and marked as admin.`);

    // 4. Ensure all OTHER users have role: 'customer' and are in 'customers' collection
    for (const u of allUsers) {
      if (u.email.toLowerCase() === adminEmail) continue;

      // Force role to 'customer'
      if (u.role !== 'customer') {
        u.role = 'customer';
        await u.save();
        console.log(`Updated user ${u.email} to role: 'customer'`);
      }

      // Upsert into customers collection
      await Customer.findOneAndUpdate(
        { email: u.email.toLowerCase() },
        {
          _id: u._id,
          name: u.name,
          email: u.email.toLowerCase(),
          password: u.password,
          phone: u.phone || '',
          address: u.address || '',
          city: u.city || '',
          state: u.state || '',
          pincode: u.pincode || '',
          role: 'customer',
          status: u.status || 'Active'
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      console.log(`✅ Synced customer '${u.email}' to 'customers' collection.`);
    }

    // 5. Remove any non-admins from 'admins' collection
    const nonAdminInAdminColl = await Admin.deleteMany({ email: { $ne: adminEmail } });
    if (nonAdminInAdminColl.deletedCount > 0) {
      console.log(`Cleaned ${nonAdminInAdminColl.deletedCount} non-admin accounts from 'admins' collection.`);
    }

    // 6. Verify summaries
    const finalAdmins = await Admin.find({}).select('email role status name');
    const finalCustomers = await Customer.find({}).select('email role status name');
    const finalUsers = await User.find({}).select('email role status name');

    console.log('\n--- VERIFICATION SUMMARY ---');
    console.log('Admins collection:', JSON.stringify(finalAdmins, null, 2));
    console.log('Customers collection:', JSON.stringify(finalCustomers, null, 2));
    console.log('Users collection:', JSON.stringify(finalUsers, null, 2));

    console.log('\n🎉 MongoDB separation completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Sync error:', error);
    process.exit(1);
  }
}

syncCollections();
