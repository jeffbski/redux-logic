import React from 'react';

export default function Search({ results, fetchStatus, onFetch }) {
  return (
    <div>
      <h3>Search npmsearch.com for packages</h3>
      <div>Status: { fetchStatus }</div>
      <input autoFocus="true" onChange={ onFetch }
        placeholder="enter keywords" />
      <ul>
        {
          results.map(item => (
            <li key={ item.name[0] }>{ item.name[0] } - { item.description[0] }</li>
          ))
        }
      </ul>
    </div>
  );
}
