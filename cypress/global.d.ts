/// <reference types="cypress" />

interface APISnapshotFixture {
  [testCaseName: string]: {
    timestamp: string;
    records: APIRecord[];
  };
}

interface APIRecord {
  url: string;
  method: string;
  request: {
    body: any;
  };
  response: {
    body: any;
  };
  matchHostIndex: number;
}
interface TestCaseInfo {
  /**
   * Cypress test file info:
   * {
   *  name: "config_passing_spec.coffee",
   *  relative: "cypress/integration/config_passing_spec.coffee",
   *  absolute: "/users/smith/projects/web/cypress/integration/config_passing_spec.coffee"
   *  specType: "integration"
   * }
   */
  testFileInfo: typeof Cypress.spec;

  /**
   * Snapshot fixture path:
   * 'cypress/fixture/folder1/folder2/a.api.snapshot.json'
   */
  fixturePath: string;

  /**
   * Snapshot fixture file name:
   * 'folder1/folder2/a.api.snapshot.json'
   */
  fixtureName: string;

  /** mocha test suite instance */
  currentTest: any;

  /**
   * full title for current test:
   * "describe" title + "it" title
   */
  currentTestFullTitle: string;
}

interface RunningConfig {
  isAPIRecording: boolean;
  isAPISnapshotUsed: boolean;
}

declare namespace Cypress {
  interface Cypress {
    // This types out our Cypress.env("key") calls better
    /**
     * Force API recording mode even there's a snapshot file, if this is true,
     * it will always ignore the existing snapshot file and try to generate
     * new one with real API.
     */
    env(key: 'forceAPIRecording'): boolean;

    /**
     * The API hosts which cypress will monitor, it supports multiple host strings
     * separated by comma.
     */
    env(key: 'apiHosts'): string;

    /**
     * The API patterns (sub path) which cypress will monitor, it also supports
     * multiple pattern strings separated by comma, same as `apiHosts`.
     */
    env(key: 'stubAPIPatterns'): string;

    /**
     * The maximum time (in milliseconds) cypress will wait for all API to be
     * finished. This number is used by `cy.waitUntilAllAPIFinished` custom command.
     */
    env(key: 'apiMaxWaitingTime'): number;
  }

  interface Chainable {
    /**
     * Running config for the test case
     */
    _config: RunningConfig;

    /**
     * Data store for the test case
     */
    _data: {
      api?: {
        records: APIRecord[];
        pendingAPICount: number;
      };
    };

    /**
     * Block the test and wait for all API calls to finish.
     */
    waitUntilAllAPIFinished: () => void;
  }
}
