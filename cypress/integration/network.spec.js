describe('Network test', function() {
  it('should show the post data after "run" button is clicked', function() {
    cy.visit('http://localhost:3456/');
    cy.get('#xhr-btn').click();
    cy.get('#xhr-result').should('contain', 'userId');
    cy.get('#fetch-btn').click();
    cy.get('#fetch-result').should('contain', 'id');
  });
});
