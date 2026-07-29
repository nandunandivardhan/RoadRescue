/**
 * RoadRescue Enterprise Admin Seeder Script
 * File: scripts/seedAdmin.js
 * 
 * Uses Firebase Admin SDK to securely seed administrative users.
 * WARNING: NEVER commit your serviceAccountKey.json to the repository!
 * Run exactly once. Delete service account key after use.
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');

if (!fs.existsSync(serviceAccountPath)) {
  console.error('\n[Error] Service account key not found at:', serviceAccountPath);
  console.log('Please place your serviceAccountKey.json inside the "scripts" folder before running.\n');
  process.exit(1);
}

const serviceAccount = require(serviceAccountPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const auth = admin.auth();

const seedAdminUser = async (email, password, fullName) => {
  try {
    console.log(`[Seeder] Creating Auth credentials for: ${email}...`);
    let userRecord;
    try {
      userRecord = await auth.createUser({
        email,
        password,
        displayName: fullName
      });
      console.log(`[Seeder] Created Auth user with UID: ${userRecord.uid}`);
    } catch (createErr) {
      if (createErr.code === 'auth/email-already-exists') {
        userRecord = await auth.getUserByEmail(email);
        console.log(`[Seeder] User already exists in Auth. UID: ${userRecord.uid}`);
      } else {
        throw createErr;
      }
    }

    const uid = userRecord.uid;

    // 1. Set roles array and metadata on users/{uid} document (merge to preserve)
    console.log(`[Seeder] Updating Firestore users/${uid}...`);
    await db.collection('users').doc(uid).set({
      email,
      name: fullName,
      roles: ['admin'],
      role: 'admin',
      adminCreatedAt: admin.firestore.FieldValue.serverTimestamp(),
      adminPermissions: [
        'view_all',
        'manage_mechanics',
        'manage_customers',
        'manage_requests',
        'view_analytics',
        'monitor_emergency'
      ],
      adminSuspendedStatus: false
    }, { merge: true });

    // 2. Write strict configuration to admins/{uid} document
    console.log(`[Seeder] Writing admins/${uid}...`);
    await db.collection('admins').doc(uid).set({
      email,
      fullName,
      role: 'super_admin',
      permissions: ['all'],
      status: 'active',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      schemaVersion: 1,
      twoFactorEnabled: false
    });

    console.log(`\n==================================================`);
    console.log(`SUCCESSFULLY SEEDED ENTERPRISE ADMIN ACCOUNT!`);
    console.log(`UID:      ${uid}`);
    console.log(`Email:    ${email}`);
    console.log(`Role:     super_admin`);
    console.log(`==================================================\n`);

  } catch (err) {
    console.error('[Seeder] Seeding process failed:', err);
  } finally {
    process.exit(0);
  }
};

// Seeding Parameters (Customize or pass via environment variables)
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@roadrescue.com';
const ADMIN_PASS = process.env.ADMIN_PASS || 'RoadRescueAdmin2026!';
const ADMIN_NAME = process.env.ADMIN_NAME || 'Console Super Admin';

seedAdminUser(ADMIN_EMAIL, ADMIN_PASS, ADMIN_NAME);
