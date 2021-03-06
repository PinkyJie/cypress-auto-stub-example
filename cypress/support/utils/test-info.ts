function getFixtureName(spec: typeof Cypress.spec): string {
  const specName = spec.name
    .replace('integration/', '')
    .replace(/(\.\w+)?\.spec\.ts/, '');
  return `${specName}.api.snapshot.json`;
}

export function getTestCaseInfo(): TestCaseInfo {
  const testFileInfo = Cypress.spec;
  const fixtureName = getFixtureName(testFileInfo);
  // this structure is got from Chrome dev tools
  const currentTest = (Cypress as any).mocha.getRunner().suite.ctx.currentTest;

  return {
    testFileInfo,
    fixtureName,
    currentTest,
    fixturePath: `cypress/fixtures/${fixtureName}`,
    currentTestFullTitle: currentTest.fullTitle(),
  };
}
