
global.fetch = jest.fn()
describe('Fetch', () => {
  beforeAll(() => {
    // Setting a mock Promise response
    global.fetch.mockImplementation(
      () =>
        new Promise(resolve => {
          resolve({
            json: () => new Promise(resolve => resolve({
              title: 'Post litle',
              body: 'Post Boby'
            }))
          })
        })
    )
  })

  it('should call fetch with url', () => {
    require('../lib/fetch-data')
    expect(global.fetch.mock.calls.length).toBe(0);
})

// Reset the mock after all the tests finish
afterAll(() => {
    global.fetch.mockClear()
  })
})