import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Detect whether the app is using default placeholders or a real Firebase configuration
export const isFirebaseConfigured = 
  firebaseConfig.projectId && 
  firebaseConfig.projectId !== "" && 
  !firebaseConfig.projectId.includes("remixed-project-id");

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth();

// Test connection as required by skill
async function testConnection() {
  if (!isFirebaseConfigured) {
    console.log("Firebase is not configured. Running in Demo Simulation Mode.");
    return;
  }
  try {
    await getDocFromServer(doc(db, 'system', 'connection'));
    console.log("Firebase connection successful");
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Firebase client is offline. Please check your configuration.");
    }
  }
}

testConnection();

