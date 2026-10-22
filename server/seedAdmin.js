require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const adminEmail = process.env.ADMIN_INITIAL_EMAIL || 'admin@ajjewellers.in';
const adminPassword = process.env.ADMIN_INITIAL_PASSWORD;

if (!adminPassword || adminPassword.length < 10) {
  console.error('❌ ERROR: You must set ADMIN_INITIAL_PASSWORD in your environment with at least 10 characters.');
  console.error('Example: ADMIN_INITIAL_PASSWORD="SecurePassphrase#2026" node seedAdmin.js');
  process.exit(1);
}

if (adminPassword === 'admin123' || adminPassword === 'password') {
  console.error('❌ ERROR: Insecure default password rejected. Choose a strong unique password.');
  process.exit(1);
}

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const db = mongoose.connection.db;
  const User = db.collection('users');
  const exists = await User.findOne({ email: adminEmail.toLowerCase() });

  const hashed = await bcrypt.hash(adminPassword, 12);

  if (!exists) {
    const doc = {
      name: 'Super Admin',
      email: adminEmail.toLowerCase(),
      password: hashed,
      role: 'admin',
      phone: '0000000000',
      status: 'Active',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    const res = await User.insertOne(doc);
    await db.collection('admins').insertOne({ ...doc, _id: res.insertedId });
    console.log(`✅ Admin user "${adminEmail}" created successfully.`);
  } else {
    await User.updateOne({ email: adminEmail.toLowerCase() }, { $set: { role: 'admin', password: hashed, status: 'Active' } });
    await db.collection('admins').updateOne(
      { email: adminEmail.toLowerCase() },
      { $set: { role: 'admin', password: hashed, status: 'Active', name: 'Super Admin' } },
      { upsert: true }
    );
    console.log(`✅ Admin user "${adminEmail}" password and role updated.`);
  }
  process.exit(0);
}).catch(e => {
  console.error('Database connection error:', e.message);
  process.exit(1);
});
