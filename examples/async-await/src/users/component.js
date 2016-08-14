import React from 'react';

export default function Users({ users, fetchStatus, onFetch,
                                onCancelFetch, onFetchProfile }) {
  return (
    <div>
      <div>Status: { fetchStatus }</div>
      <button onClick={ onFetch }>Fetch Users</button>
      <button onClick={ onCancelFetch }>Cancel</button>
      <ul>
        {
          users.map(user => (
            <li key={ user.id }>
              <button onClick={ () => onFetchProfile(user.id) } >
                { user.first_name } { user.last_name }
              </button>
            </li>
          ))
        }
      </ul>
    </div>
  );
}
