/**
 * Block the test and wait for all API calls to finish.
 *
 * We maintain a pending API counter internally for each test case, every time we send out
 * an API request, we increase the counter by 1, every time we receive a response, we
 * decrease the counter by 1.
 *
 * Inside this command, we block the test until this counter equals 0. Call this command
 * every time you expect a series of API requests which might take a while.
 */
Cypress.Commands.add('waitUntilAllAPIFinished', () => {
  /**
   * If you pass a function as a parameter when calling should(), Cypress will retry that
   * function continuously within the timeout you provided, until the expectation inside
   * that function has been met.
   *
   * Note: the purpose of get('body') here is just to pass the timeout to the should()
   * call, basically you can get any element on the page.
   */
  const timeout = Cypress.env('apiMaxWaitingTime') || 60 * 1000;
  cy.get('body', { timeout, log: false }).should(() => {
    expect(
      cy._data.api.pendingAPICount,
      'Waiting for pending API requests'
    ).to.eq(0);
  });
});
