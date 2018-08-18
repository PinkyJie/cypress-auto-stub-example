describe('Network test', function() {
  it('should show the user data', function() {
    cy.visit('/');
    cy.get('#xhr-btn').click();
    cy.get('#xhr-result').should('contain', 'George');
    cy.get('#fetch-btn').click();
    cy.get('#fetch-result').should('contain', 'Janet');
  });
});
