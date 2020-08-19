/**
 * Set default headers if none provided
 */
export const getDefaultFetchHeaders = (fetchHeaders) => {
  if (fetchHeaders) return fetchHeaders;

  // Set overridable default headers
  return {
    'Content-Type': 'application/json',
  };
}
