import addRefreshTokenToBody from '../lib/add-refresh-token-to-body';

test('addRefreshTokenToBody', () => {
  const fetchBody = () => ({
    query: 'someQueryHere',
  });

  const refreshToken = '1234';

  const expectedBody = {
    query: 'someQueryHere',
    variables: {
      refreshToken: '1234'
    }
  }

  const createdBody = addRefreshTokenToBody(fetchBody, refreshToken);

  console.log('createdBody:', createdBody);
  
  expect(createdBody).toBe(expectedBody);
});
