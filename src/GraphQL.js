import React from 'react';
import ApolloClient from 'apollo-boost';
import gql from 'graphql-tag';
import md5 from 'blueimp-md5';

const customFetch = (uri, options) => {
  const bodyHash = md5(options.body);
  return fetch(`${uri}?_md5=${bodyHash}`, options);
};

const client = new ApolloClient({
  uri: 'https://fakerql.com/graphql',
  fetch: customFetch,
});

const GET_ALL_USERS = gql`
  query AllUsers($count: Int!) {
    users: allUsers(count: $count) {
      id
      firstName
      lastName
      email
    }
  }
`;

const LOGIN = gql`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      token
    }
  }
`;

const UPDATE_USER = gql`
  mutation UpdateUser($id: ID!, $firstName: String!, $lastName: String!) {
    updateUser(id: $id, firstName: $firstName, lastName: $lastName) {
      id
      firstName
      lastName
      email
    }
  }
`;

class GraphQL extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      queryResult: null,
      updateResult: null,
    };
  }

  queryAllUsers = () => {
    client
      .query({
        query: GET_ALL_USERS,
        variables: { count: 3 },
      })
      .then(({ data: { users } }) => {
        this.setState({
          queryResult: users,
        });
      });
  };

  updateUser = () => {
    client
      .mutate({
        mutation: LOGIN,
        variables: {
          email: 'cypress@xxx',
          password: 'test',
        },
      })
      .then(({ data: { login } }) => {
        return client.mutate({
          mutation: UPDATE_USER,
          variables: {
            id: this.state.queryResult[0].id,
            firstName: 'Cypress',
            lastName: 'Test',
          },
          context: {
            headers: {
              Authorization: `Bearer ${login.token}`,
            },
          },
        });
      })
      .then(({ data: { updateUser } }) => {
        this.setState({
          updateResult: updateUser,
        });
      });
  };

  render() {
    const { queryResult, updateResult } = this.state;
    return (
      <div>
        <h1>Graph QL examples:</h1>
        <hr />

        <h2>Example 1: GraphQL query</h2>
        <button id="graphql-query-btn" onClick={this.queryAllUsers}>
          Query All User(GraphQL)
        </button>
        <div id="graphql-query-result">
          {queryResult && JSON.stringify(queryResult)}
        </div>

        <h2>Example 2: GraphQL mutation</h2>
        <button id="graphql-mutation-btn" onClick={this.updateUser}>
          Update User(GraphQL)
        </button>
        <div id="graphql-mutation-result">
          {updateResult && JSON.stringify(updateResult)}
        </div>
      </div>
    );
  }
}

export default GraphQL;
