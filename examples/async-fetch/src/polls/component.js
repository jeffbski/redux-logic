import React from 'react';

export default function Polls({ polls, fetchStatus, fetchPolls, cancelFetchPolls }) {
  return (
    <div>
      <div>Status: { fetchStatus }</div>
      <button onClick={ fetchPolls }>Fetch polls</button>
      <button onClick={ cancelFetchPolls }>Cancel</button>
      <ul>
        {
          polls.map(poll => (
            <li key={ poll.id }>{ poll.question }</li>
          ))
        }
      </ul>
    </div>
  );
}
