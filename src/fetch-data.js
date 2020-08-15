export const fetchData = async (query, variables, apiUrl) => {
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      cache: 'no-cache',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        variables,
      }),
    });

    return await response.json();
  } catch (e) {
    console.log(e);
  }
};
