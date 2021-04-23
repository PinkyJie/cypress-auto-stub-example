import { getTestCaseInfo } from './test-info';

const DEFAULT_RUNNING_CONFIG: RunningConfig = {
  isAPIRecording: false,
  isAPISnapshotUsed: false,
};

export function getRunningConfig(): Cypress.Chainable<RunningConfig> {
  return isInAPIRecording().then((isRecording) => {
    return cy.wrap(
      {
        ...DEFAULT_RUNNING_CONFIG,
        isAPIRecording: isRecording,
        isAPISnapshotUsed: !isRecording,
      },
      { log: false }
    );
  });
}

/**
 * Return a promise-like which will resolve if it's recording API or not.
 */
function isInAPIRecording(): Cypress.Chainable<boolean> {
  const forceAPIRecording = Cypress.env('forceAPIRecording');
  // test case information
  const { fixturePath, currentTestFullTitle } = getTestCaseInfo();

  /**
   * Recording mode is on when:
   *   `forceAPIRecording` flag is True, or
   *   Fixture for this test case is not existed (same as Jest snapshot test)
   *
   * `forceAPIRecording` is a flag you can use to update fixture
   */
  if (forceAPIRecording) {
    return cy.wrap(true, { log: false });
  }
  // a promise which will resolve value for isInRecordingMode
  return cy
    .task('isFileExisted', fixturePath, { log: false })
    .then((isFixtureExisted) => {
      if (!isFixtureExisted) {
        // turn on recording if fixture file is not existed
        return cy.wrap(true, { log: false });
      }
      // check if there is a key whose name is the same as this test case
      return cy
        .readFile(fixturePath, { log: false })
        .then((apiRecords: APISnapshotFixture) => {
          // turn on recording if fixture for this test case is not existed
          return !apiRecords[currentTestFullTitle];
        });
    });
}
