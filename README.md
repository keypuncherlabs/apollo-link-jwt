# Apollo Link JWT [![npm version](https://badge.fury.io/js/apollo-auth-react-native.svg)](https://badge.fury.io/js/apollo-auth-react-native)

## Introduction

An Apollo Link utility to handle JWT Authorization requests by automatically setting the headers with the access token and handling the refresh logic when the access token expires

## Technologies

- [Apollo Client React v3.0](https://www.apollographql.com/docs/react/)
- [JWT Decode](https://www.npmjs.com/package/jwt-decode)

## Install

`npm i apollo-link-jwt`

Note: Apollo V3 is a required peer depedency expected to be installed in your project already

## Example

```
Add actual code example here...
```

## API

### apiUrl

The URL string of your API endpoint where the refresh token call should be made

### getTokens

An async supported function that should return a valid accessToken and refreshToken stored in the client.  Because this supports aysnc, you can use local storage or async storage which requires 'await'.

### fetchBody

The query required to fetch a new access token with when a valid refresh token was given.  The package also accepts an optional 'variables' attribute which can contain additional fields if required by the server, such as 'email'.

### fetchHeaders

An optional attribute to set the headers needed during the refresh token fetch.  This defaults to 'Content-Type': 'application/json' if nothing is provided.

### onRefreshComplete

The main callback required to handle the fetch logic.  This function should contain the logic required to parse the tokens from the response and return the new access and refresh tokens to the utility. You can also perform any other logic in here on failures, such as calling a sign out method already defined in the application.

### debugMode

Optional boolean that sends helpful console logs to the output for debugging purposes. Recommended to leave this off for production.

## Roadmap

1. Add unit tests
2. Convert project to TypeScript
