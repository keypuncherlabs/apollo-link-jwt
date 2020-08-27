import {getDefaultFetchHeaders} from '../lib/get-default-fetch-headers';

const testHeader = {
    'Content-Type': 'application/json',
    'token': 'test'
}

const deafultHeader = {
    'Content-Type': 'application/json',
}

describe('Fetch Headers test', () => {
    it('checking fetch headers with valid header', () => {
      expect(getDefaultFetchHeaders(testHeader)).toEqual(testHeader);
    });

    it('checking fetch headers with undefined header', () => {
        expect(getDefaultFetchHeaders()).toEqual(deafultHeader);
      });
  
  });