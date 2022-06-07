import db from './admin';
import fetch from 'node-fetch';

const TOKENS_PATH = 'tokens/qb-tokens';

type ITokenData = {
  accessToken: string;
  authorizationBasic: string;
  refreshToken: string;
  realmId: string;
};

type IQBResponse = {
  refresh_token: string;
  access_token: string;
};

export const refreshToken = async (): Promise<void> => {
  // Get Existing Tokens
  const tokens = await db.doc(TOKENS_PATH).get();
  console.log('Refreshing Token');
  if (!tokens.exists) {
    await db.doc(TOKENS_PATH).set(
      {
        error: true,
        message: 'No Tokens Found',
        lastRun: new Date().getTime(),
      },
      { merge: true }
    );
  } else {
    const data = tokens.data() as ITokenData;
    if (!data.accessToken || !data.refreshToken || !data.authorizationBasic) {
      await db.doc(TOKENS_PATH).set(
        {
          error: true,
          message: 'Insufficient Data in Firestore',
          lastRun: new Date().getTime(),
        },
        { merge: true }
      );
      return;
    }
    const newTokens = await refreshTokens(
      data.refreshToken,
      data.authorizationBasic
    );
    if (newTokens.accessToken === '' || newTokens.refreshToken === '') {
      await db.doc(TOKENS_PATH).set(
        {
          error: true,
          message: 'Unable to Fetch Access Token from QB',
          lastRun: new Date().getTime(),
        },
        { merge: true }
      );
      return;
    } else {
      await db.doc(TOKENS_PATH).set(
        {
          accessToken: newTokens.accessToken,
          refreshToken: newTokens.refreshToken,
          error: false,
          message:
            'Successfully Fetched Access Token from QB @ ' +
            new Date().toLocaleString(),
          lastRun: new Date().getTime(),
        },
        { merge: true }
      );
      console.log('Refreshed Token Successfully');
    }
  }
};

const refreshTokens = async (
  refreshToken: string,
  authorizationBasic: string
): Promise<{ refreshToken: string; accessToken: string }> => {
  const headers = {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Authorization': `Basic ${authorizationBasic}`,
    'accept': 'application/json',
  };

  return await fetch(
    'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer',
    {
      method: 'POST',
      headers,
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    }
  )
    .then((res) =>
      res
        .json()
        .then((data) => {
          const { refresh_token, access_token } = data as IQBResponse;
          if (refresh_token !== undefined && access_token !== undefined) {
            return { refreshToken: refresh_token, accessToken: access_token };
          }
          return { refreshToken: '', accessToken: '' };
        })
        .catch((error) => {
          db.doc(TOKENS_PATH).set(
            {
              error: true,
              message: `Invalid Decoding Token: ${error}`,
              lastRun: new Date().getTime(),
            },
            { merge: true }
          );
          return { refreshToken: '', accessToken: '' };
        })
    )
    .catch((error) => {
      console.log('Error happened = ', error);
      db.doc(TOKENS_PATH).set(
        {
          error: true,
          message: `Invalid Token: ${error}`,
          lastRun: new Date().getTime(),
        },
        { merge: true }
      );
      return { refreshToken: '', accessToken: '' };
    });
};
