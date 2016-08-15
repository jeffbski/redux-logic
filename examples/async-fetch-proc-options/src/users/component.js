import React from 'react';

export default function Users({ users, fetchStatus, onFetch, onCancelFetch }) {
  return (
    <div>
      <div>Status: { fetchStatus }</div>
      <button onClick={ onFetch }>Fetch users</button>
      <button onClick={ onCancelFetch }>Cancel</button>
      <ul>
        {
          users.map(user => (
            <li key={ user.id }>{ user.first_name } { user.last_name }</li>
          ))
        }
      </ul>
    </div>
  );
}
