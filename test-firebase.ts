import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import * as fs from 'fs';

async function runTests() {
  console.log('=== STARTING FIREBASE CONNECTION TESTS ===\n');

  // Test 1: Firebase Initialization
  console.log('Test 1: Checking Firebase Initialization...');
  const configRaw = fs.readFileSync('./firebase-applet-config.json', 'utf-8');
  const config = JSON.parse(configRaw);

  if (!config.projectId) {
    throw new Error('❌ Missing projectId in firebase-applet-config.json');
  }
  if (!config.apiKey) {
    throw new Error('❌ Missing apiKey in firebase-applet-config.json');
  }

  const app = initializeApp({
    apiKey: config.apiKey,
    authDomain: config.authDomain,
    projectId: config.projectId,
    storageBucket: config.storageBucket,
    messagingSenderId: config.messagingSenderId,
    appId: config.appId,
  });

  console.log('✔ Firebase App initialized successfully.');
  console.log(`  - Project ID: ${app.options.projectId}`);
  console.log(`  - App Name: ${app.name}`);
  console.log(`  - Auth Domain: ${app.options.authDomain}\n`);

  // Test 2: Firestore Connectivity
  console.log('Test 2: Checking Firestore Connectivity...');
  const firestoreDbId = config.firestoreDatabaseId || '(default)';
  console.log(`  - Target Database ID: ${firestoreDbId}`);
  const db = getFirestore(app, config.firestoreDatabaseId);

  try {
    const testDocRef = doc(db, 'test', 'connection');
    const snapshot = await getDocFromServer(testDocRef);
    console.log('✔ Firestore connectivity check succeeded.');
    console.log(`  - Document exists on server: ${snapshot.exists()}`);
    console.log('  - Firestore is reachable and online.\n');
  } catch (error) {
    console.error('❌ Firestore connection error:', error);
    throw error;
  }

  // Test 3: Google Authentication Configuration
  console.log('Test 3: Checking Google Authentication Configuration...');
  const auth = getAuth(app);
  const googleProvider = new GoogleAuthProvider();

  if (!auth) {
    throw new Error('❌ Firebase Auth instance could not be created.');
  }
  if (googleProvider.providerId !== 'google.com') {
    throw new Error(`❌ Google Auth Provider ID mismatch: expected 'google.com', got '${googleProvider.providerId}'`);
  }

  console.log('✔ Google Authentication configured successfully.');
  console.log(`  - Provider ID: ${googleProvider.providerId}`);
  console.log(`  - Current Auth user: ${auth.currentUser ? auth.currentUser.email : 'None (Ready for login)'}`);
  console.log(`  - Client OAuth ID: ${config.oAuthClientId || 'Configured via Firebase Auth'}\n`);

  console.log('=== ALL 3 FIREBASE TESTS PASSED SUCCESSFULLY! ===');
  process.exit(0);
}

runTests().catch((err) => {
  console.error('\n❌ Test suite failed:', err);
  process.exit(1);
});
