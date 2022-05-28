// import fetch from 'node-fetch';
import * as functions from 'firebase-functions';
import admin = require('firebase-admin');

const app = admin.initializeApp(functions.config().firebase);
const db = app.firestore();

export default db;
