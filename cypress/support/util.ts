/**
 * Block the test and wait for all API to be finished.
 *
 * We have a counter in cy.server()'s onRequest/onResponse callback, every time we send out
 * a API request, we increase the counter by 1, every time we receive a response, we decrease
 * the counter by 1. Inside this command, we block the test and this counter equals to 0.
 *
 * Call this command every time you expect a series of API requests which might takes longer.
 */
Cypress.Commands.add('waitUntilAllAPIFinished', () => {
  /**
   * If you pass a function as a parameter when calling should(), Cypress will retry that
   * function continuously within the timeout you provided, until the expectation inside
   * that function has been met.
   *
   * Note: the purpose of get('body') here is just to pass timeout to should() call,
   * basically you can get any element on page.
   */
  const timeout = Cypress.env('apiMaxWaitingTime') || 60 * 1000;
  cy.get('body', { timeout }).should(() => {
    expect(cy._apiCount).to.eq(0);
  });
});
