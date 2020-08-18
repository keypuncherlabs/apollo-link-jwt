import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import { default as jwtDecode } from 'jwt-decode';

import { refreshTokensUtil } from './refresh-tokens-util';

export const ApolloAuthReactNative = ({
  apiUrl,
  getTokens,
  refreshTokenQuery,
  getRefreshTokenQueryOptions,
  onRefreshComplete,
  debugMode = false,
}) => {
  /**
   * Global cached tokens to prevent an expensive Async lookup on every request
   */
  let cachedAccessToken = null;
  let cachedRefreshToken = null;

  /**
   * Resets the internally cached values
   */
  const clearCache = () => {
    if (debugMode) {
      console.log('\x1b[36m%s\x1b[0m', 'clearCache():');
    }

    cachedAccessToken = null;
    cachedRefreshToken = null;
  };

  /**
   * Check to see if the cache already exists
   */
  const cacheExists = () => {
    if (debugMode) {
      console.log('\x1b[36m%s\x1b[0m', 'cacheExists?:', !!cachedAccessToken && !!cachedRefreshToken);
    }

    return !!cachedAccessToken && !!cachedRefreshToken;
  }

  /**
   * 
   * Check to see if the JWT is expired
   */
  const isJwtExpired = (token) => {
    if (typeof(token) !== 'string' || !token) throw new Error('Invalid token provided');

    let isJwtExpired = false;

    const decodedToken = jwtDecode(token);
    if (!decodedToken) return false;

    const currentTime = new Date().getTime() / 1000;
    if (currentTime > decodedToken.exp) isJwtExpired = true;
  
    return isJwtExpired;
  }

  /**
   * Set the cached tokens when found in Async Storage to avoid expensive lookups again
   */
  const setTokenCache = async () => {
    if (debugMode) {
      console.log('\x1b[36m%s\x1b[0m', 'setTokenCache()');
    }

    const { accessToken, refreshToken } = await getTokens();

    if (debugMode) {
      console.log('\x1b[36m%s\x1b[0m', 'accessTokens provided:', accessToken);
    }

    cachedAccessToken = accessToken;
    cachedRefreshToken = refreshToken;
  };

  /**
   * Refresh tokens if they are expired in cache and asyncStorage through callback
   */
  const refreshTokens = async () => {
    if (debugMode) {
      console.log('\x1b[36m%s\x1b[0m', 'refreshTokens()');
    }

    // Optional variables that can be passes to make the refresh token call
    const refreshTokenQueryOptions = await getRefreshTokenQueryOptions();

    // Return early and save a network request if the refresh token has been found to be expired
    if (isJwtExpired(cachedRefreshToken)) return (null, null, 'Refresh token has expired');

    // Try refreshing the access token using the cachedRefreshToken
    const { newAccessToken, newRefreshToken, errors } = await refreshTokensUtil({
      refreshTokenQuery,
      refreshTokenQueryOptions,
      refreshToken: cachedRefreshToken,
      apiUrl,
    });

    await onRefreshComplete(newAccessToken, newRefreshToken, errors);

    if (errors) {
      clearCache();

      return;
    }

    // Update cached tokens
    cachedAccessToken = newAccessToken;
    cachedRefreshToken = newRefreshToken;
  };

  /**
   * Set the request headers for every request using cached tokens (when authenticated)
   */
  const SetHeadersLink = setContext(async (_, { headers }) => {
    if (debugMode) {
      console.log('\x1b[36m%s\x1b[0m', '(Entry Point) setHeadersLink()');
    }

    // 1. Set cache from params if tokens are not set
    if (!cacheExists()) await setTokenCache();

    // 2. Refresh the accessToken and update the cache with new tokens if it has expired
    // (on failure of refresh fail gracefully)
    if (cachedAccessToken && isJwtExpired(cachedAccessToken)) await refreshTokens();

    // 3. Add the accessToken to the request headers if right conditions are met
    if (cacheExists() && !isJwtExpired(cachedAccessToken)) {
      if (debugMode) {
        console.log('Setting headers with access token!');
      }

      return {
        headers: {
          ...headers,
          'x-token': cachedAccessToken,
        },
      };
    }
  });

  /**
   * Error handler to report errors and handle token refresh when a respnose
   * returns an unauthenticated error message
   */
  const ErrorHandlerLink = onError(({ graphQLErrors, operation, forward }) => {
    if (debugMode) {
      console.log('\x1b[36m%s\x1b[0m', 'errorHandlerLink()');
    }

    // If error is due to unathenticated user request and a refresh token is available
    const { extensions } = graphQLErrors[0];

    if (extensions.code === 'UNAUTHENTICATED') {
      return forward(operation);
    }
  });

  /**
   * Return the array of links we composed in the proper order
   */
  return [
    SetHeadersLink,
    ErrorHandlerLink,
  ];
};
