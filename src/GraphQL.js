import React from 'react';
import { gql, useLazyQuery, useMutation } from '@apollo/client';

const GET_ALL_USERS = gql`
  query AllUsers($limit: Int!) {
    users(limit: $limit) {
      id
      name
      timestamp
    }
  }
`;

const INSERT_USER = gql`
  mutation InsertUser($name: String!, $rocket: String!) {
    insert_users(objects: [{ name: $name, rocket: $rocket }]) {
      returning {
        id
        name
        timestamp
        rocket
      }
    }
  }
`;

export function GraphQL() {
  const [getAllUsersQuery, { data: queryResult }] = useLazyQuery(GET_ALL_USERS);
  const [insertUserMutation] = useMutation(INSERT_USER);

  const [updateResult, setUpdateResult] = React.useState(undefined);

  const getAllUsers = React.useCallback(async () => {
    getAllUsersQuery({ variables: { limit: 10 } });
  }, [getAllUsersQuery]);

  const insertUser = React.useCallback(async () => {
    const insertUserResult = await insertUserMutation({
      variables: {
        rocket: 'Cypress auto stub rocket',
        name: 'Cypress',
      },
    });
    setUpdateResult(insertUserResult);
  }, [insertUserMutation]);

  return (
    <div>
      <h1>Graph QL examples:</h1>
      <hr />

      <h2>Example 1: GraphQL query</h2>
      <button id="graphql-query-btn" onClick={getAllUsers}>
        Query All User(GraphQL)
      </button>
      <div id="graphql-query-result">
        {queryResult && JSON.stringify(queryResult)}
      </div>

      <h2>Example 2: GraphQL mutation</h2>
      <button id="graphql-mutation-btn" onClick={insertUser}>
        Update User(GraphQL)
      </button>
      <div id="graphql-mutation-result">
        {updateResult && JSON.stringify(updateResult)}
      </div>
    </div>
  );
}
