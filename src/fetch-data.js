export const fetchData = async ({ apiUrl, headers, body }) => {
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      cache: 'no-cache',
      headers,
      body: JSON.stringify(body),
    });

    return await response.json();
  } catch (e) {
    console.log(e);
  }
};
