import * as functions from 'firebase-functions';
import { refreshToken } from './qbToken';

exports.scheduledFunction = functions.pubsub
  .schedule('every 5 minutes')
  .onRun(refreshToken);
