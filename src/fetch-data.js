export const fetchData = async (apiUrl, fetchConfig) => {
  try {
    const response = await fetch(apiUrl, JSON.stringify(fetchConfig));

    return response.json();
  } catch (e) {
    console.log('Refresh token response error:', e);
  }
};
