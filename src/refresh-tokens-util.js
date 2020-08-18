import { fetchData } from './fetch-data';

export const refreshTokensUtil = async ({ refreshToken, refreshTokenQuery, refreshTokenQueryOptions, apiUrl }) => {
  const variables = {
    ...refreshTokenQueryOptions,
    refreshToken,
  };

  const data = await fetchData(refreshTokenQuery, variables, apiUrl);

  // Return early if the refresh attempt failed
  if (data && data.errors) {
    return { errors: data.errors || 'failed to refresh the token' };
  }

  const { accessToken: newAccessToken, refreshToken: newRefreshToken } = data && data.data && data.data.token;

  return { newAccessToken, newRefreshToken, errors: null };
};
