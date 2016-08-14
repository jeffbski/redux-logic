import React from 'react';

export default function User({ user, fetchStatus, onCancelFetch }) {
  return (
    <div>
      <div>Status: { fetchStatus }</div>
      <button onClick={ onCancelFetch }>Cancel User Fetch</button>
      { userDetails(user) }
    </div>
  );
}

function userDetails(user) {
  if (!user) { return; }
  return (
    <div>
      <h2>{ user.first_name } {user.last_name}</h2>
      <div>ID: { user.id }</div>
      <div>Profile Name: {user.profile.name}</div>
      <div>Profile Year: {user.profile.year}</div>
      <div>Profile Bar: {user.profile.pantone_value}</div>
      <div><img src={user.avatar} alt="avatar" /></div>
    </div>
  );
}
