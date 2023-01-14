import admin from 'firebase-admin';
import getConfig from "next/config";
const { serverRuntimeConfig } = getConfig();

const serviceAccount: any = {
  "type": "service_account",
  "project_id": process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  "private_key_id": serverRuntimeConfig.FIREBASE_PRIVATE_KEY_ID,
  //"private_key": serverRuntimeConfig.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  "private_key": serverRuntimeConfig.FIREBASE_PRIVATE_KEY,
  "client_email": serverRuntimeConfig.FIREBASE_CLIENT_EMAIL,
  "client_id": serverRuntimeConfig.FIREBASE_CLIENT_ID,
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": serverRuntimeConfig.FIREBASE_CERT_URL
};

if (!admin.apps.length) {
    try {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        //databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL
      });
    } catch (error: any) {
      console.log('Firebase admin initialization error', error.stack);
    }
}

export default admin.firestore();

/*
const { initializeApp, applicationDefault, cert } = require('firebase-admin/app');
const { getFirestore, Timestamp, FieldValue } = require('firebase-admin/firestore');

const serviceAccount = process.env.SERVICE_ACCOUNT_KEY;

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();
export default db;
*/