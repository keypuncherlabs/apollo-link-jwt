import { isJwtExpired } from '../lib/is-jwt-expired';

const testToken =
  'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWUsImp0aSI6ImNhYWE2MzIzLTBkM2ItNGQyMS05MzQ0LTE5ZDJiN2ViYmQ3MCIsImlhdCI6MTU5ODIwNTkwNSwiZXhwIjoxNTk4MjA5NTA1fQ.3zb1HaAQqYvJk8FQkzLX2-9YifQbINfVX6ypUzvLfwc';
const testNonStringToken = 123;

describe('jwt expiration test', () => {
  it('checking valid token with non string token', () => {
    expect(() => { isJwtExpired(testNonStringToken); }).toThrow('Invalid token provided');
  });

  it('checking valid token with undefined token', () => {
    expect(() => { isJwtExpired(''); }).toThrow('Invalid token provided');
  });


  it('checking valid token with expiration date', () => {
    const isJwt = isJwtExpired(testToken);
    expect(isJwt).toBe(true);
  });
});
