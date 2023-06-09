/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const {onRequest} = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const {onDocumentCreated,onDocumentUpdated} = require("firebase-functions/v2/firestore");
const functions = require("firebase-functions");
const { getAuth, createUserWithEmailAndPassword } = require("firebase-admin/auth");

// The Firebase Admin SDK to access Firestore.
const {initializeApp} = require("firebase-admin/app");
const {getFirestore} = require("firebase-admin/firestore");

initializeApp();


// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

 exports.helloWorld = onRequest((request, response) => {
   logger.info("Hello logs!", {structuredData: true});
   response.send("Hello from Firebase!");
 });

// Take the text parameter passed to this HTTP endpoint and insert it into
// Firestore under the path /messages/:documentId/original
exports.addmessage = onRequest(async (req, res) => {
  // Grab the text parameter.
  const original = req.query.text;
  const autor = req.query.autor;
  // Push the new message into Firestore using the Firebase Admin SDK.
  const writeResult = await getFirestore().collection("messages").add({original: original,autor:autor});
  // Send back a message that we've successfully written the message
  res.json({result: "Message with ID:"+ writeResult.id+" added."});
});

exports.makeuppercase = onDocumentCreated("/messages/{documentId}", (event) => {
  // Grab the current value of what was written to Firestore.
  const original = event.data.data().original;

  // Access the parameter `{documentId}` with `event.params`
  logger.log("Uppercasing", event.params.documentId, original);

  const uppercase = original.toUpperCase();

  // You must return a Promise when performing
  // asynchronous tasks inside a function
  // such as writing to Firestore.
  // Setting an 'uppercase' field in Firestore document returns a Promise.
  return event.data.ref.set({uppercase}, {merge: true});
});




exports.actualizado = onDocumentUpdated("/messages/{documentId}",async (event) => {
    const previousValues =  event.data.before.data();
    const document =  event.data.after.data();

    const db = getFirestore();
    const writeResult = await getFirestore().collection("messagesHistory").add(previousValues);

    return;
});

exports.createFireStoreProfil = functions.auth.user().onCreate(async (user) => {
  // ...
  const uid = user.uid;
  const email = user.email; // The email of the user.
  const displayName = user.displayName; // The display name of the user.
  //const writeResult = await getFirestore().collection("profiles").add({original: original,autor:autor});
  const writeResult = await getFirestore().collection("profiles").doc(uid).set({name:displayName,uid:uid,email:email});
  return;
});

exports.profileCreated = onDocumentCreated("/profiles/{profileId}", (event) => {
  const perfil = event.data.data();

  // Access the parameter `{documentId}` with `event.params`
  logger.log("Creando Perfil en Auth", event.params.documentId, original);

    const auth = getAuth();
    createUserWithEmailAndPassword(auth, perfil.email, perfil.password)
      .then((userCredential) => {
        // Signed in
        const user = userCredential.user;
        return event.data.ref.set({authUID:user.uid}, {merge: true});
        // ...
      })
      .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        // ..
      });
    return;
});

