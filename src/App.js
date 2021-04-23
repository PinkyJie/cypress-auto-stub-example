import React from 'react';
import md5 from 'blueimp-md5';
import {
  ApolloClient,
  ApolloProvider,
  InMemoryCache,
  HttpLink,
} from '@apollo/client';

import { XhrAndFetch } from './XhrAndFetch';
import { GraphQL } from './GraphQL';

const customFetch = (uri, options) => {
  const bodyHash = md5(options.body);
  return fetch(`${uri}?_md5=${bodyHash}`, options);
};

const httpLink = new HttpLink({
  uri: 'https://api.spacex.land/graphql',
  fetch: customFetch,
});

const client = new ApolloClient({
  cache: new InMemoryCache(),
  link: httpLink,
});

function App() {
  return (
    <ApolloProvider client={client}>
      <div>
        <XhrAndFetch />
        <GraphQL />
      </div>
    </ApolloProvider>
  );
}

export default App;
