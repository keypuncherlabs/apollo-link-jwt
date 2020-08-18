import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import { default as jwtDecode } from 'jwt-decode';

import { refreshTokens } from './refresh-tokens';

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
  let isAccessTokenExpired = false;

  /**
   * Resets the internally cached values
   */
  const clearCache = () => {
    if (debugMode) {
      console.log('\x1b[36m%s\x1b[0m', 'clearCache():');
    }

    cachedAccessToken = null;
    cachedRefreshToken = null;
    isAccessTokenExpired = false;
  };

  /**
   * Check to see if the cache already exists
   */
  const cacheExists = () => {
    if (debugMode) {
      console.log('\x1b[36m%s\x1b[0m', 'cacheExists?:', !!cachedAccessToken && !!cachedRefreshToken);
    }

    return cachedAccessToken && cachedRefreshToken;
  }

  /**
   * 
   * Check to see if the JWT is expired
   */
  const isJwtExpiredCheck = (token) => {
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
      console.log('\x1b[36m%s\x1b[0m', '1. setTokenCache() - skipped:', cacheExists);
    }

    if (cacheExists) return;

    const { accessToken, refreshToken } = await getTokens();

    cachedAccessToken = accessToken;
    cachedRefreshToken = refreshToken;
  };

  /**
   * Check expiration time of access token and reset cache accordingly
   */
  const checkAccessTokenExpiration = () => {
    if (debugMode) {
      console.log('\x1b[36m%s\x1b[0m', '2. checkAccessTokenExpirationLink() - skipped:', !cachedAccessToken);
    }

    if (!cachedAccessToken) return true;

    /**
     * Check the expires attribute on the JWT
     * NOTE: This is not to be considered secure, but rather a convenience method
     * to determine if we should save a network call when a refresh token is needed
     * We still handle the logic of an expired token manually as well if an endpoint
     * returns an error indicating an expired access token was provided
     */
    if (isJwtExpiredCheck(cachedAccessToken)) isAccessTokenExpired = true;

    return false;
  };

  /**
   * Set the request headers for every request using cached tokens (when authenticated)
   */
  const setHeadersLink = setContext((_, { headers }) => {
    if (debugMode) {
      console.log('\x1b[36m%s\x1b[0m', '3. setHeadersLink() - skipped:', !cachedAccessToken);
    }

    if (!cachedAccessToken) return;

    return {
      headers: {
        ...headers,
        'x-token': cachedAccessToken,
      },
    };
  });

  /**
   * Refresh tokens if they are expired in cache and asyncStorage through callback
   */
  const refreshTokensLink = setContext(async (_, { headers }) => {
    if (debugMode) {
      console.log('\x1b[36m%s\x1b[0m', '5. refreshTokensLink() - skipped:', !isAccessTokenExpired);
    }

    // Skip if the access token has not expired yet
    if (!isAccessTokenExpired || !cachedRefreshToken) return;

    // Optional variables that can be passes to make the refresh token call
    const refreshTokenQueryOptions = await getRefreshTokenQueryOptions();

    // Try refreshing the access token using the cachedRefreshToken
    const { newAccessToken, newRefreshToken, errors } = await refreshTokens({
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

    // Reset isAccessTokenExpired
    isAccessTokenExpired = false;

    // Update the headers with new cachedAccessToken
    return {
      headers: {
        ...headers,
        'x-token': cachedAccessToken,
      },
    };
  });

  /**
   * Error handler to report errors and handle token refresh when a respnose
   * returns an unauthenticated error message
   */
  const errorHandlerLink = onError(({ graphQLErrors, operation, forward }) => {
    if (debugMode) {
      console.log('\x1b[36m%s\x1b[0m', 'errorHandlerLink()');
    }

    // If error is due to unathenticated user request and a refresh token is available
    const { extensions } = graphQLErrors[0];

    if (extensions.code === 'UNAUTHENTICATED') {
      isAccessTokenExpired = true;

      return forward(operation);
    }
  });

  /**
   * Return the array of links we composed in the proper order
   */
  return [
    setHeadersLink,
    errorHandlerLink,
  ];
};
