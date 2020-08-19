import { default as jwtDecode } from 'jwt-decode';

/**
 * 
 * Check to see if the JWT is expired
 */
export const isJwtExpired = (token) => {
  if (typeof(token) !== 'string' || !token) throw new Error('Invalid token provided');

  let isJwtExpired = false;

  const decodedToken = jwtDecode(token);
  if (!decodedToken) return false;

  const currentTime = new Date().getTime() / 1000;
  if (currentTime > decodedToken.exp) isJwtExpired = true;

  return isJwtExpired;
}
