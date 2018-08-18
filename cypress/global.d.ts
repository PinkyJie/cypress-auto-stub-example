interface APIRecord {
  url: string;
  method: Cypress.HttpMethod;
  request: {
    body: any;
  };
  response: {
    body: any;
  };
  timestamp: string;
}

interface APISnapshotFixture {
  [testCaseName: string]: APIRecord[];
}

declare namespace Cypress {
  // tslint:disable-next-line interface-name
  interface Chainable {
    _apiData: APIRecord[];
    _apiCount: number;

    waitUntilAllAPIFinished: () => {};
  }
}
