import { CyHttpMessages } from 'cypress/types/net-stubbing';

import { getTestCaseInfo } from './test-info';

/**
 * Whenever a request is started, update `pendingAPICount` accordingly.
 */
function increaseAPICountOnRequestStart() {
  cy._data.api.pendingAPICount += 1;
}

/**
 * Whenever a request is finished, update `pendingAPICount` accordingly.
 */
function decreaseAPICountOnRequestFinish() {
  const { isAPIRecording } = cy._config;
  /**
   * Sometimes there are some time windows between API requests, e.g. Request1 finishes,
   * but Request2 starts after 100ms, in this case, `cy.waitUntilAllAPIFinished()` would
   * not work correctly, so when we decrease the counter, we need to have a delay here.
   */
  const delayTime = isAPIRecording ? 500 : 50;
  if (cy._data.api.pendingAPICount === 1) {
    setTimeout(() => {
      cy._data.api.pendingAPICount -= 1;
    }, delayTime);
  } else {
    cy._data.api.pendingAPICount -= 1;
  }
}

/**
 * The interception handler for stubbed requests, which will hit the real server.
 */
function routeHandlerWithRealResponse(
  request: CyHttpMessages.IncomingHttpRequest
) {
  const { isAPIRecording } = cy._config;
  increaseAPICountOnRequestStart();
  request.reply((response) => {
    if (isAPIRecording) {
      recordAPIResponse(request, response);
      response.send();
      decreaseAPICountOnRequestFinish();
    }
  });
}

/**
 * The interception handler for requests which won't hit the real server, instead it will
 * return a mocked response.
 */
function routeHandlerWithMockResponse(
  request: CyHttpMessages.IncomingHttpRequest,
  mockedResponse: any
) {
  increaseAPICountOnRequestStart();
  request.reply(mockedResponse);
  // request.reply() won't wait the response to complete, so put a manual wait
  setTimeout(() => {
    decreaseAPICountOnRequestFinish();
  }, 100);
}

/**
 * Setup cypress interception to make sure API recording, API wait working.
 */
export function setupCypressInterception() {
  const { fixtureName } = getTestCaseInfo();
  cy._data.api = {
    records: [],
    pendingAPICount: 0,
  };
  const { isAPIRecording, isAPISnapshotUsed } = cy._config;

  cy.log(`API Recording: ${isAPIRecording ? 'ON' : 'OFF'}`);
  if (isAPISnapshotUsed) {
    cy.log(`Use API snapshot: ${fixtureName}`);
  }

  /**
   * `startMonitorAPI()` is always required regardless of snapshot or real API:
   *   * If real API is used, `cy.intercept` is running against regex to monitor all
   * API calls inside test, so that `cy.waitUntilAllAPIFinished()` can work as expected.
   *   * If snapshot is used, `cy.intercept` is running against the APIs defined in the
   * snapshot (logic in`loadAPIFixture()`), which means unmatched APIs (not included
   * in fixture) won't be captured by that, that's why we still need to fallback `cy.
   * intercept` here to run against regex in addition.
   */
  startMonitorAPI();
  if (isAPISnapshotUsed) {
    loadAPIFixture();
  }
}

/**
 * Write recorded API data to fixture snapshot file.
 */
export function writeRecordedAPIToFixture() {
  const { currentTest, fixturePath, currentTestFullTitle } = getTestCaseInfo();

  if (currentTest.state === 'passed') {
    // if fixture file exists, only update the data related to this test case
    cy.task('isFileExisted', fixturePath, { log: false }).then(
      (isFixtureExisted) => {
        const recordedData = {
          timestamp: new Date().toJSON(),
          records: cy._data.api.records,
        };
        if (isFixtureExisted) {
          cy.readFile(fixturePath, { log: false }).then(
            (snapshotFixture: APISnapshotFixture) => {
              snapshotFixture[currentTestFullTitle] = recordedData;
              cy.writeFile(fixturePath, snapshotFixture, {
                log: false,
              });
            }
          );
        } else {
          cy.writeFile(
            fixturePath,
            {
              [currentTestFullTitle]: recordedData,
            },
            { log: false }
          );
        }
        cy.log('API recorded', cy._data.api.records);
      }
    );
  }
}

function recordAPIResponse(
  request: CyHttpMessages.IncomingHttpRequest,
  response: CyHttpMessages.IncomingHttpResponse
) {
  /**
   * save URL without the host info, because API host might be different between
   * Record and Replay session
   */
  let url = '';
  let matchHostIndex: number = -1;
  const apiHosts = Cypress.env('apiHosts').split(',');
  for (let i = 0; i < apiHosts.length; i += 1) {
    const host = apiHosts[i].trim();
    if (request.url.includes(host)) {
      url = request.url.replace(host, '');
      matchHostIndex = i;
      break;
    }
  }

  // the host of API is not the one we are interested
  if (matchHostIndex === -1) {
    return;
  }

  // save API request/response into an array so we can write these info to fixture
  cy._data.api.records.push({
    url,
    method: request.method,
    request: {
      body: request.body,
    },
    response: {
      body: response.body,
    },
    matchHostIndex,
  });
}

function startMonitorAPI() {
  const stubAPIPatterns = Cypress.env('stubAPIPatterns').split(',');
  stubAPIPatterns.forEach((pattern: string) => {
    const apiRegex = new RegExp(pattern.trim());
    // let Cypress stub all API requests which match the pattern defined in cypress.json
    cy.intercept('GET', apiRegex, routeHandlerWithRealResponse);
    cy.intercept('POST', apiRegex, routeHandlerWithRealResponse);
    cy.intercept('PUT', apiRegex, routeHandlerWithRealResponse);
    cy.intercept('DELETE', apiRegex, routeHandlerWithRealResponse);
  });
}

function loadAPIFixture() {
  const { fixtureName, currentTestFullTitle } = getTestCaseInfo();
  const apiHosts = Cypress.env('apiHosts').split(',');
  return cy.fixture(fixtureName).then((snapshotFixture: APISnapshotFixture) => {
    // in snapshot, we use `currentTestFullTitle` from .spec.ts file as the Key
    const snapshot = snapshotFixture[currentTestFullTitle];
    snapshot.records.forEach((apiRecord) => {
      const fullUrl = `${apiHosts[apiRecord.matchHostIndex].trim()}${
        apiRecord.url
      }`;
      cy.intercept(apiRecord.method as any, fullUrl, (request) => {
        routeHandlerWithMockResponse(request, apiRecord.response.body || {});
      });
    });
  });
}
