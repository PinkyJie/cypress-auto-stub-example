interface APIRecord {
  url: string;
  method: Cypress.HttpMethod;
  request: {
    body: any;
  };
  response: {
    body: any;
  };
  matchHostIndex: number;
}

interface APISnapshotFixture {
  [testCaseName: string]: {
    timestamp: string;
    records: APIRecord[];
  };
}

declare namespace Cypress {
  // tslint:disable-next-line interface-name
  interface Chainable {
    _apiData: APIRecord[];
    _apiCount: number;
    _isInRecordingMode: boolean;

    waitUntilAllAPIFinished: () => void;
  }
}
