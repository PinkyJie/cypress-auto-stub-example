# cypress-auto-stub-example [![CI](https://github.com/PinkyJie/cypress-auto-stub-example/actions/workflows/ci.yml/badge.svg?branch=master)](https://github.com/PinkyJie/cypress-auto-stub-example/actions/workflows/ci.yml) ![cypress version](https://img.shields.io/badge/cypress-7.1.0-brightgreen) [![cypress-auto-stub-example](https://img.shields.io/endpoint?url=https://dashboard.cypress.io/badge/simple/nf8wkk/master&style=flat&logo=cypress)](https://dashboard.cypress.io/projects/nf8wkk/runs)

This is an example project to demonstrate how to automatically stub all API requests happened in your [Cypress](https://www.cypress.io/) test and how to record/replay them.

> We are available on [Cypress Dashboard](https://www.cypress.io/dashboard/), go [there](https://dashboard.cypress.io/#/projects/nf8wkk/runs) to check the running results. (Registration required)

## Problems to solve

**_1. E2E tests take a long time to run, they are too slow._**

One concern of running E2E tests is that it takes long time to run, which makes sense because all your API calls are targeted to the real server. To resolve this issue, a single solution is to use mock API in your E2E tests. That's good, but here comes another question: you need to manually update your mocking data according to the API change regularly.

A better solution is:

- Use real API response when you write E2E tests, and **Record these responses and write them into files**.
- Use the recorded API response to run your tests in future.

This project demonstrates how to make this process more smoothly and automatically with Cypress.

**_2. E2E tests are too flaky, how many seconds do I need to wait?_**

Though Cypress already ships with a unique mechanism to automatically block your test and retry until your expectation meets, but sometimes you still need to explicitly wait for all network API calls to be finished. In this example we implement a new command called `waitUntilAllAPIFinished` to solve this problem. Thanks to Cypress's full network control ability, now it's easier to know how many network API calls are still pending, so that we can wait for them to be finished first before you do any assertion.

## Try it

- Clone this project.
- Install all dependencies by running `yarn install` or `npm install`.
- Build the website by running `yarn build` or `npm run build`.
- Launch the website by running `yarn serve` or `npm run serve`.
- Open Cypress byr running `yarn cy:open`, then run the test `network.spec.ts`: (the same mechanism as Jest snapshot testing)
  - If a snapshot file does not exist inside the `fixture` folder, tests will be running with the real API, and after all tests are passed, a snapshot file containing all API responses will be generated in the `fixture` folder.
  - If a snapshot file does exist inside the `fixture` folder, but fixture data for this test case does not exist (e.g. there is no key with the same name as the test case name existing inside that snapshot file), tests will be running with the real API, then the snapshot file will be updated with the recorded API responses.
  - If a snapshot file in the `fixture` folder already exists and has the mocking data for this test case, the test should run very fast, because all API responses are stubbed and use the snapshot file as responses.
- If you want to update the snapshot file regardless of the existing fixture file existence, use `yarn cy:open:record`. When using this command, all tests will run against the real API, and all returned API responses will override the existing snapshot file if it exists.
- You can also use `yarn cy:run` to run all Cypress tests in headless mode.

## More details for demo [![Edit cypress-auto-stub-example](https://codesandbox.io/static/img/play-codesandbox.svg)](https://codesandbox.io/s/github/PinkyJie/cypress-auto-stub-example/tree/master/)

The website page we are testing in this project contains 3 examples for XHR and Fetch:

- Example 1:
  - Click a button to call API (GET https://reqres.in/api/users) using XHR. API response JSON will be displayed below after it returns.
- Example 2:
  - Click a button to call API (POST https://reqres.in/api/users) using Fetch. API response JSON will be displayed below after it returns.
  - To demonstrate Fetch can be supported here.
- Example 3:
  - Click a button to call 30 **sequential** API (GET https://reqres.in/api/users/1 to https://reqres.in/api/users/10 for 3 times) using Fetch. API response JSON (`userId: 10`) will be displayed below after it returns. **sequential** here mean the 2nd API call will file only after the 1st API call returns.
  - To demonstrate the usage of a new custom command `cy.waitUntilAllAPIFinished()` which will make sure the testing is blocked until all API calls are finished.

It also includes 2 examples for GraphQL:

> <del>Currently when you use `cy.route()` to mock API response with fixtures, Cypress only match the URL and HTTP method you provided, for most of the cases, this is enough for mocking purpose. However, if you use libraries like `GraphQL`, all API requests are using the same URL with different request body, for this case, you need to mock different responses based on different request bodies, which is not possible before Cypress fixes [#687](https://github.com/cypress-io/cypress/issues/687).</del> **Note: Cypress's `cy.intercept()` introduced after v6 already has full support to monitor request body, but the follow solution is still handy and faster.** A simple workaround is: use `md5` or other hash library to hash your request body into a string, and put this string as a query parameter in your URL, like `?_md5=xxxx`, now your URL contains the request body information: different request bodies result in different md5 hash string, thus you can rely on URL and HTTP method to do API mocking with request body in consideration.

- Example 1:
  - Click a button to query all users (Query https://api.spacex.land/) using GraphQL query. API response JSON will be displayed below after it returns.
- Example 2:
  - Click a button to insert a new user (Mutation https://api.spacex.land/) using GraphQL mutation. API response JSON will be displayed below after it returns.

## More detail for implementation

> Inspired by [this article](https://medium.com/ax2-inc/dynamic-xhr-responses-recording-stubbing-with-cypress-9257d4f730cd) and Jest snapshot testing.

- Check the main implementation in [`cypress/support/utils/auto-stub.ts`](cypress/support/utils/auto-stub.ts)

  1. use `cy.intercept` to monitor all API requests
  2. use `cy.writeFile` to write all recorded API responses in a fixture file
  3. while replaying, use `cy.fixture` to load API responses from the fixture file

- Check the implementation for custom command `cy.waitUntilAllAPIFinished` in [`cypress/support/commands.ts`](cypress/support/commands.ts#L11)

  1. maintain an internal counter for API calls: increase 1 when filing a new API request, decrease 1 when receiving a API response
  2. use Cypress's [Automatic Retry Assertion](https://docs.cypress.io/guides/core-concepts/introduction-to-cypress.html#Asserting-in-English) to regularly check this counter, block the testing until it equals to 0

- Check the custom URI configuration(adding `?md5=xxx`) for GraphQL in [`src/App.js`](src/App.js#L13)

There are 4 new configuration parameters introduced in this example:

> All configuration parameters are defined under `env` as environment variables because:
>
> - It's easier for overriding by `cypress open --env foo=bar`
> - All existing configurations provided by Cypress are strongly typed, you can't add new configuration type when you use Typescript.

| Parameter         | Type                                                                          | Description                                                                                             | Required           | Default Value |
| ----------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | ------------------ | ------------- |
| forceAPIRecording | boolean                                                                       | force enabling auto record (used to update api mocking data)                                            |                    | false         |
| apiHosts          | string (multiple host separated by `,`)                                       | URL for API endpoint                                                                                    | :white_check_mark: |               |
| stubAPIPatterns   | string (multiple pattern separated by `,`, will be used in `new RegExp(xxx)`) | API pattern needs to be stubbed                                                                         | :white_check_mark: |               |
| apiMaxWaitingTime | number (in milliseconds)                                                      | used by `cy.waitUntilAllAPIFinished`, the maximum time when we wait for all API requests to be finished |                    | 60000 (60s)   |

> Note: `apiHosts` and `stubAPIPatterns` must be aligned with each others.

The generated recording file inside `cypress/fixtures` folder has the following format.

```javascript
{
  "Test case name": {
    "timestamp": "2018-08-26T07:27:00.582Z",
    "records": [
      "url": "xxx",
      "method": "xxx",
      "request": {
        "body": {},
      },
      "response": {
        "body": {},
      },
      // this means which host/pattern this API matches
      "matchHostIndex": 0,
    ]
  }
}
```
