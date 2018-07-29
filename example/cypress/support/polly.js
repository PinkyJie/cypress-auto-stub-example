const { Polly } = require('@pollyjs/core');
const XHRAdapter = require('@pollyjs/adapter-xhr');
const FetchAdapter = require('@pollyjs/adapter-fetch');
const RESTPersister = require('@pollyjs/persister-rest');

Polly.register(XHRAdapter);
Polly.register(FetchAdapter);
Polly.register(RESTPersister);

beforeEach(() => {
  cy.polly = new Polly('Cypress record', {
    logging: true,
    persister: 'rest',
    persisterOptions: {
      rest: {
        host: `http://localhost:${Cypress.env('polly.recordingServerPort')}`,
      },
    },
  });
  cy.on('window:before:load', win => {
    cy.polly.configure({
      adapters: ['xhr', 'fetch'],
      adapterOptions: {
        fetch: {
          context: win,
        },
      },
    });
    console.log(win.XMLHttpRequest);
    console.log(win.fetch);
  });
});

afterEach(() => {
  cy.polly.stop();
});
