import { addRefreshTokenToBody }from '../lib/add-refresh-token-to-body';

test('addRefreshTokenToBody', async () => {
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

  const createdBody = await addRefreshTokenToBody(fetchBody, refreshToken);
  expect(createdBody).toEqual(expectedBody);
});
