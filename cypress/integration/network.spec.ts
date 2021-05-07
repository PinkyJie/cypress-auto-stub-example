describe('Network test', () => {
  it('should show the user data by XHR', () => {
    cy.visit('/');

    // fetch all users
    cy.get('#xhr-btn').click();
    cy.waitUntilAllAPIFinished();
    cy.get('#xhr-result').should('contain', '"page":1');
    // create a user
    cy.get('#post-btn').click();
    cy.waitUntilAllAPIFinished();
    cy.get('#post-result').should('contain', 'Cypress');
    // fetch 10 single users one by one
    cy.get('#fetch-btn').click();
    cy.waitUntilAllAPIFinished();
    cy.get('#fetch-result').should('contain', '"id":10');
  });

  it('should show the user data by GraphQL', () => {
    cy.visit('/');

    // query all users
    cy.get('#graphql-query-btn').click();
    cy.waitUntilAllAPIFinished();
    cy.get('#graphql-query-result').should('contain', 'user');
    // update a user
    cy.get('#graphql-mutation-btn').click();
    cy.waitUntilAllAPIFinished();
    cy.get('#graphql-mutation-result').should('contain', 'Cypress');
  });
});
