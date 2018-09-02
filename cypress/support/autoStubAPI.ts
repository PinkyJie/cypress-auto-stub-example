function getFixtureName(spec: any) {
  const specName = spec.name
    .replace('integration/', '')
    .replace('.spec.ts', '');
  return `${specName}.api.snapshot.json`;
}

before(() => {
  cy.log('Load polyfill for mocking fetch:');
  let polyfill: any;
  /**
   * Cypress does not support monitor Fetch API request right now (see
   * https://github.com/cypress-io/cypress/issues/95), so here we need
   * to manually load a polyfill Fetch to make sure Fetch API will fallback
   * to XHR, which Cypress can monitor.
   */
  const polyfillUrl = 'https://unpkg.com/unfetch/dist/unfetch.umd.js';
  cy.request(polyfillUrl).then(response => {
    polyfill = response.body;
  });
  Cypress.on('window:before:load', win => {
    delete win.fetch;
    (win as any).eval(polyfill);
    win.fetch = (win as any).unfetch;
  });
});

// do not use arrow function because we need to use `this` inside
beforeEach(function() {
  const forceAPIRecording: boolean = Cypress.env('forceAPIRecording');
  /**
   * Recording mode is on when:
   *   `forceAPIRecording` flag is True, or
   *   Fixture for this test case is not existed (same as Jest snapshot test)
   *
   * `forceAPIRecording` is a flag you can use to update fixture
   */
  // a promise which will resolve value for isInRecordingMode
  let isInRecordingModePromise;
  // test case information
  const testFileInfo = Cypress.spec;
  const fixtureName = getFixtureName(testFileInfo);
  const fixturePath = `cypress/fixtures/${fixtureName}`;
  const testCaseTitle = this.currentTest.fullTitle();

  if (forceAPIRecording) {
    isInRecordingModePromise = Cypress.Promise.resolve(true);
  } else {
    isInRecordingModePromise = cy
      .task('isFixtureExisted', fixturePath, { log: false })
      .then(isFixtureExisted => {
        if (!isFixtureExisted) {
          // turn on recording if fixture file is not existed
          return true;
        } else {
          // check if there is a key whose name is the same as this test case
          return cy
            .readFile(fixturePath, { log: false })
            .then((apiRecords: APISnapshotFixture) => {
              // turn on recording if fixture for this test case is not existed
              return !apiRecords[testCaseTitle];
            });
        }
      });
  }

  // cy.task() does not return Promise, need to use any to bypass type check
  (isInRecordingModePromise as any).then((isInRecordingMode: boolean) => {
    cy._isInRecordingMode = isInRecordingMode;

    cy.log(`API Auto Recording: ${isInRecordingMode ? 'ON' : 'OFF'}`);
    if (isInRecordingMode) {
      cy.log('Use real API response.');
    } else {
      cy.log(`Use recorded API response: ${fixtureName}`);
    }

    cy._apiData = [];
    cy._apiCount = 0;
    cy.server({
      onRequest: () => {
        cy._apiCount++;
      },
      onResponse: (xhr: any) => {
        /**
         * Sometimes there are some time windows between API requests, e.g. Request1 finishes,
         * but Request2 starts after 100ms, in this case, cy.waitUntilAllAPIFinished() would
         * not work correctly, so when we decrease the counter, we need to have a delay here.
         */
        const delayTime = isInRecordingMode ? 500 : 0;
        if (cy._apiCount === 1) {
          setTimeout(() => {
            cy._apiCount--;
          }, delayTime);
        } else {
          cy._apiCount--;
        }

        if (isInRecordingMode) {
          /**
           * save URL without the host info, because API host might be different between
           * Record and Replay session
           */
          let url = '';
          let matchHostIndex: number = -1;
          const apiHosts = Cypress.env('apiHosts').split(',');
          for (let i = 0; i < apiHosts.length; i++) {
            const host = apiHosts[i].trim();
            if (xhr.url.includes(host)) {
              url = xhr.url.replace(host, '');
              matchHostIndex = i;
              break;
            }
          }

          const method = xhr.method;
          const request = {
            body: xhr.request.body,
          };
          const response = {
            body: xhr.response.body,
          };
          // save API request/response into an array so we can write these info to fixture
          cy._apiData.push({
            url,
            method,
            request,
            response,
            matchHostIndex,
          });
        }
      },
    });

    if (isInRecordingMode) {
      const stubAPIPatterns = Cypress.env('stubAPIPatterns').split(',');
      stubAPIPatterns.forEach((pattern: string) => {
        const apiRegex = new RegExp(pattern.trim());
        // let Cypress stub all API requests which match the pattern defined in cypress.json
        cy.route('GET', apiRegex);
        cy.route('POST', apiRegex);
        cy.route('PUT', apiRegex);
        cy.route('DELETE', apiRegex);
      });
    } else {
      const apiHosts = Cypress.env('apiHosts').split(',');
      cy.fixture(fixtureName).then((apiRecords: APISnapshotFixture) => {
        apiRecords[testCaseTitle].records.forEach(apiRecord => {
          const fullUrl = `${apiHosts[apiRecord.matchHostIndex].trim()}${
            apiRecord.url
          }`;
          cy.route(apiRecord.method, fullUrl, apiRecord.response.body);
        });
      });
    }
  });
});

// do not use arrow function because we need to use `this` inside
afterEach(function() {
  // only save api data to fixture when test is passed
  if (this.currentTest.state === 'passed' && cy._isInRecordingMode) {
    const testFileInfo = Cypress.spec;
    const fixtureName = getFixtureName(testFileInfo);
    const fixturePath = `cypress/fixtures/${fixtureName}`;
    const testCaseTitle = this.currentTest.fullTitle();
    // if fixture file exists, only update the data related to this test case
    cy.task('isFixtureExisted', fixturePath, { log: false }).then(
      isFixtureExisted => {
        if (isFixtureExisted) {
          cy.readFile(fixturePath, { log: false }).then(
            (apiRecords: APISnapshotFixture) => {
              apiRecords[testCaseTitle] = {
                timestamp: new Date().toJSON(),
                records: cy._apiData,
              };
              cy.writeFile(fixturePath, apiRecords, { log: false });
            }
          );
        } else {
          cy.writeFile(
            fixturePath,
            {
              [testCaseTitle]: {
                timestamp: new Date().toDateString(),
                records: cy._apiData,
              },
            },
            { log: false }
          );
        }
        cy.log('API recorded', cy._apiData);
      }
    );
  }
});
