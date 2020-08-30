![Apollo Link JWT Logo](https://starscraper.io/images/png/apollo-link-jwt.png)

# Apollo Link JWT
[![npm version](https://badge.fury.io/js/apollo-link-jwt.svg)](https://badge.fury.io/js/apollo-link-jwt)
[![Bulid Status](https://circleci.com/gh/star-scraper/apollo-link-jwt.svg?style=svg)](https://app.circleci.com/pipelines/github/star-scraper/apollo-link-jwt)
[![codecov](https://codecov.io/gh/star-scraper/apollo-link-jwt/branch/master/graph/badge.svg)](https://codecov.io/gh/star-scraper/apollo-link-jwt)
[![contributions welcome](https://img.shields.io/badge/contributions-welcome-brightgreen.svg?style=flat)](https://github.com/star-scraper/apollo-link-jwt/pulls)
[![GitHub license](https://img.shields.io/github/license/Naereen/StrapDown.js.svg)](https://github.com/Naereen/StrapDown.js/blob/master/LICENSE)

An Apollo Link utility to handle JWT Authorization requests by automatically setting the headers with the access token and handling the refresh logic when the access token expires.

## Introduction

The package automatically detects when an access token has expired using JWT decode to keep the secret out of the client.  It works with any existing endpoint that returns a new access token and refresh token from a provided refresh token by using a callback to handle any response structure.

**Note:** *This package supports tokens stored in async-storage or any other manner of async lookup, helpful for React Native projects*

## Install

`npm i apollo-link-jwt`

**Note:** *Apollo V3 is a required peer depedency expected to be installed in your project already*

## Example

~~~javascript
const httpLink = createHttpLink({
  uri: GRAPHQL_API,
});

/**
 * Create Apollo Link JWT
 */
const apolloLinkJWT = ApolloLinkJWT({
  apiUrl: 'https://your-api-url',
  getTokens: async () => {
    const accessToken = await AsyncStorage.getItem('ACCESS_TOKEN');
    const refreshToken = await AsyncStorage.getItem('REFRESH_TOKEN');

    return { accessToken, refreshToken };
  },
  fetchBody: async () => {
    // Define fetch query
    const query = {...};

    return { query };
  },
  onRefreshComplete: async (data) => {
    // Parse 'data' to extract the tokens from your existing refresh token API response
    // Handle errors if fetch failed, call existing methods such as signOut();
    ...
    return { newAccessToken, newRefreshToken };
  },
});

return new ApolloClient({
  link: from([
    apolloLinkJWT,
    httpLink, // Add terminating link last
  ]),
});
~~~

## Request Headers

This utility will set the `Authorization: Bearer token` headers on requests when an access token is provided. This scheme is described by the [rfc6750](https://tools.ietf.org/html/rfc6750)

## Motivation

Becasue handling JWT in the client should be an easy process and consistently handled across projects using Apollo Client. In addition, there are many times when you will want to provide an access token and refresh token stored in AsynStorage (if you're using React Native), which requires async support by the utlity.  With Apollo Link JWT, you can pass async functions which get the tokens on the client with aysnc support.

The premise is simple:

1. Set the request headers once the app has a valid access token and refresh token
2. Check the expiration of the access token in the utility before every network request, if the access token has an expired 'exp' attribute, then use the refresh token to make a fetch and retrieve a new access token and refresh token
3. Send the tokens back to your client application so they can store them someplace (potentially async storage or local storage)
4. Automatically append the access token JWT to the headers going forward
5. Allow the app to handle a graceful logout when the refresh token fetch has failed (in the case of the refresh token being invalid)

The manual process of checking the access tokens expiration should be done in the client before every network request so an unnecessary network request is not made once it's expired.  We can use JTW Decode here because we're only validating the token expiration time, even if this was faked by the user, it would only trigger a refresh token lookup sooner than expected.

## API

| Attribute | Required | Async | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| apiUrl | true | false | - | The URL string of your API endpoint where the refresh token call should be made. |
| getTokens | true | true | - | An async supported function that should return a valid accessToken and refreshToken stored in the client.  Because this supports aysnc, you can use local storage or async storage which requires 'await'. |
| fetchBody | true | true | - | The query required to fetch a new access token with when a valid refresh token was given.  The package also accepts an optional 'variables' attribute which can contain additional fields if required by the server, such as 'email'. |
| fetchHeaders | false | false | `{ 'Content-Type': 'application/json' }` | An optional attribute to set the headers needed during the refresh token fetch. |
| onRefreshComplete | true | true | - | The main callback required to handle the fetch logic.  This function should contain the logic required to parse the tokens from the response and return the new access and refresh tokens to the utility. You can also perform any other logic in here on failures, such as calling a sign out method already defined in the application. |
| debugMode | false | false | `false` | Optional boolean that sends helpful console logs to the output for debugging purposes. Recommended to leave this off for production. |

## Usage

~~~javascript
const getTokens = async () => {
  const accessToken = await getAsyncStorage(ACCESS_TOKEN);
  const refreshToken = await getAsyncStorage(REFRESH_TOKEN);

  return {
    accessToken,
    refreshToken,
  };
};

const onRefreshComplete = async (data) => {
  // Find and return the access token and refresh token from the provided fetch callback
  const newAccessToken = data?.data?.token?.accessToken;
  const newRefreshToken = data?.data?.token?.refreshToken;

  // Handle sign out logic if the refresh token attempt failed
  if (!newAccessToken || !newRefreshToken) {
    console.log('Redirect back to login, because the refresh token was expired!');

    signOutHandler();

    return;
  }

  // Update tokens in AsyncStorage
  await setAsyncStorage(ACCESS_TOKEN, newAccessToken);
  await setAsyncStorage(REFRESH_TOKEN, newRefreshToken);

  // Return the tokens back to the lib to cache for later use
  return {
    newAccessToken,
    newRefreshToken,
  };
};

/**
 * Configure the body of the token refresh method
 */
const fetchBody = async () => ({
  query: `mutation RefreshAccessToken($email: String!, $refreshToken: String!) {
    token (email: $email, refreshToken: $refreshToken) {
      accessToken
      refreshToken
    }
  }`,
  variables: {
    email: await getAsyncStorage(EMAIL),
  },
});

/**
 * Create Apollo Link JWT
 */
const apolloLinkJWT = ApolloLinkJWT({
  apiUrl: GRAPHQL_API,
  getTokens,
  fetchBody,
  onRefreshComplete,
  debugMode: true,
});

const httpLink = createHttpLink({
  uri: GRAPHQL_API,
});

return new ApolloClient({
  link: from([
    apolloLinkJWT,
    httpLink, // Add terminating link last
  ]),
});
~~~

## Technologies

- [Apollo Client React v3.0](https://www.apollographql.com/docs/react/)
- [JWT Decode](https://www.npmjs.com/package/jwt-decode)

## Roadmap

1. Add unit tests
2. Convert project to TypeScript
