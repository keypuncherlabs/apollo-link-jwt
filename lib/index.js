import { ApolloLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';

import { getDefaultFetchHeaders } from './get-default-fetch-headers';
import { addRefreshTokenToBody } from './add-refresh-token-to-body';
import { isJwtExpired } from './is-jwt-expired';
import { fetchData } from './fetch-data';

export const ApolloLinkJWT = ({
  apiUrl,
  getTokens,
  fetchBody,
  fetchHeaders,
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

    // Return early and save a network request if the refresh token has been found to be expired
    if (isJwtExpired(cachedRefreshToken)) return (null, null, 'Refresh token has expired');

    // Construct the fetch body
    const body = await addRefreshTokenToBody(fetchBody, cachedRefreshToken);

    // Get the proper headers
    const headers = getDefaultFetchHeaders(fetchHeaders);

    // Try refreshing the access token using the cachedRefreshToken
    const response = await fetchData({
      apiUrl,
      headers,
      body,
    });

    // Allow configurable function to indicate if the endpoint returned the correct response
    const onRefreshResponse = await onRefreshComplete(response);

    if (!onRefreshResponse) {
      clearCache();

      return;
    }

    const { newAccessToken, newRefreshToken } = onRefreshResponse;

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
    if ((cachedAccessToken && isJwtExpired(cachedAccessToken)) || (!cachedAccessToken && cachedRefreshToken)) await refreshTokens();

    // 3. Add the accessToken to the request headers if right conditions are met
    if (cacheExists() && !isJwtExpired(cachedAccessToken)) {
      if (debugMode) {
        console.log('Setting headers with access token!');
      }

      return {
        headers: {
          ...headers,
          authorization: `Bearer ${cachedAccessToken}`,
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
    if (graphQLErrors && Array.isArray(graphQLErrors)) {
      const { extensions } = graphQLErrors[0];

      if (extensions.code === 'UNAUTHENTICATED') {
        return forward(operation);
      }
    }
  });

  /**
   * Return the array of links we composed in the proper order as a single element
   */
  return ApolloLink.concat(SetHeadersLink, ErrorHandlerLink);
};
