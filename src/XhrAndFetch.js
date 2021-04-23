import React from 'react';

function request(url) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.addEventListener('load', function () {
      resolve(xhr);
    });

    xhr.addEventListener('error', reject);
    xhr.open('GET', url, true);
    xhr.send();
  });
}

export class XhrAndFetch extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      xhrResults: null,
      postResult: null,
      fetchResult: null,
    };
  }

  xhrClick = () => {
    request('https://reqres.in/api/users').then((res) => {
      this.setState({
        xhrResult: res.responseText,
      });
    });
  };

  createUserClick = () => {
    fetch('https://reqres.in/api/users', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Cypress',
        job: 'Tester',
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    })
      .then((response) => response.json())
      .then((json) => {
        this.setState({
          postResult: JSON.stringify(json),
        });
      });
  };

  fetchClick = () => {
    let promise = Promise.resolve();
    const MAX = 30;
    for (let i = 1; i <= MAX; i++) {
      promise = promise.then(() => {
        const userId = i % 10 === 0 ? 10 : i % 10;
        if (i === MAX) {
          return fetch(`https://reqres.in/api/users/${userId}`, {
            cache: 'no-cache',
          })
            .then((response) => response.json())
            .then((json) => {
              this.setState({
                fetchResult: JSON.stringify(json),
              });
            });
        }
        return fetch(`https://reqres.in/api/users/${userId}`);
      });
    }
    return promise;
  };

  render() {
    const { xhrResult, postResult, fetchResult } = this.state;
    return (
      <div>
        <h1>XHR and Fetch examples:</h1>
        <hr />

        <h2>Example 1: a single GET request using XHR</h2>
        <button id="xhr-btn" onClick={this.xhrClick}>
          Get Users(XHR)
        </button>
        <div id="xhr-result">{xhrResult}</div>

        <h2>Example 2: a single POST request using Fetch</h2>
        <button id="post-btn" onClick={this.createUserClick}>
          Create User(fetch)
        </button>
        <div id="post-result">{postResult}</div>

        <h2>Example 3: 30 sequential GET requests using Fetch</h2>
        <p>
          This is to simulate a series of requests which takes long time (around
          14s) to finish.
        </p>
        <p>
          In your test, you can see how cy.waitUntilAllAPIFinished() handles
          this situation.
        </p>
        <p>
          (Note: After all requests, only one user(userId: 10) will be displayed
          below.)
        </p>
        <button id="fetch-btn" onClick={this.fetchClick}>
          Get Single Users(fetch)
        </button>
        <div id="fetch-result">{fetchResult}</div>
      </div>
    );
  }
}
