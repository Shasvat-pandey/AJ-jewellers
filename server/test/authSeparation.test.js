const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Admin = require('../models/Admin');
const Customer = require('../models/Customer');
const User = require('../models/User');

async function testAuthSeparation() {
  console.log('--- RUNNING AUTH SEPARATION & MONGODB VERIFICATION ---');
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB Atlas');

    // Test 1: Check Admin Model & Collection
    const adminDoc = await Admin.findOne({ email: 'admin@aj.com' });
    if (!adminDoc) throw new Error('admin@aj.com not found in admins collection!');
    if (adminDoc.role !== 'admin') throw new Error(`admin@aj.com has wrong role in admins: ${adminDoc.role}`);
    console.log(`✅ Test 1 Passed: Admin model finds '${adminDoc.email}' with role '${adminDoc.role}' in 'admins' collection.`);

    // Test 2: Check Customer Model & Collection
    const customerDocs = await Customer.find({});
    if (customerDocs.length === 0) throw new Error('No customers found in customers collection!');
    for (const c of customerDocs) {
      if (c.role !== 'customer') throw new Error(`Customer ${c.email} has non-customer role: ${c.role}`);
    }
    console.log(`✅ Test 2 Passed: Customer model retrieved ${customerDocs.length} customers from 'customers' collection, all with role 'customer'.`);

    // Test 3: Check admin password matching
    const isMatch = await adminDoc.matchPassword('admin123');
    if (!isMatch) throw new Error('Admin password verification failed for admin123!');
    console.log('✅ Test 3 Passed: Admin password verification succeeded for admin@aj.com.');

    // Test 4: Verify JWT token generation and role assertion
    const adminToken = jwt.sign({ id: String(adminDoc._id) }, process.env.JWT_SECRET, { expiresIn: '1d' });
    const decoded = jwt.verify(adminToken, process.env.JWT_SECRET);
    const resolvedAdmin = await User.findById(decoded.id) || await Admin.findById(decoded.id);
    if (!resolvedAdmin || resolvedAdmin.role !== 'admin') {
      throw new Error('Admin token did not resolve to an admin user!');
    }
    console.log(`✅ Test 4 Passed: Admin JWT verified; resolved to user '${resolvedAdmin.email}' with role 'admin'.`);

    // Test 5: Verify Customer JWT token cannot bypass admin check
    const sampleCustomer = customerDocs[0];
    const customerToken = jwt.sign({ id: String(sampleCustomer._id) }, process.env.JWT_SECRET, { expiresIn: '1d' });
    const decodedCust = jwt.verify(customerToken, process.env.JWT_SECRET);
    const resolvedCust = await User.findById(decodedCust.id) || await Customer.findById(decodedCust.id);
    if (resolvedCust.role === 'admin') {
      throw new Error(`Customer '${resolvedCust.email}' should NOT have admin role!`);
    }
    console.log(`✅ Test 5 Passed: Customer JWT correctly resolved to role '${resolvedCust.role}' (non-admin).`);

    console.log('\n🎉 ALL 5 AUTH SEPARATION TESTS PASSED WITH 100% SUCCESS!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Test Failure:', err.message);
    process.exit(1);
  }
}

testAuthSeparation();
