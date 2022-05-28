import * as functions from 'firebase-functions';

exports.scheduledFunction = functions.pubsub
  .schedule('every 5 minutes')
  .onRun(() => {
    console.log('This will be run every 5 minutes!');
    return null;
  });
