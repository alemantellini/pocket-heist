import { getApp, getApps, initializeApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"

// Web app config for the pocket-heist-website-ale project. These values are
// identifiers, not secrets; access is controlled by Auth and Firestore rules.
const firebaseConfig = {
  apiKey: "AIzaSyCZNUJgAbxrkTtE6_xexkKVRGn5BmymLio",
  authDomain: "pocket-heist-website-ale.firebaseapp.com",
  projectId: "pocket-heist-website-ale",
  storageBucket: "pocket-heist-website-ale.firebasestorage.app",
  messagingSenderId: "82532180566",
  appId: "1:82532180566:web:f38ebcd85e6d01e31411f7",
}

// reuse the app across hot reloads instead of initialising twice
const app = getApps().length ? getApp() : initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)
