import React from 'react';

export default function Users({ fields, errors, valid, message, list,
                                onFieldChange, onSubmit }) {
  return (
    <div>
      <h2>New User</h2>
      <form onSubmit={onSubmit}>
      <div className="message">{ message }</div>
      <div className="error">
        <ul>
          { errors.map(error => (
            <li key={error}>{error}</li>)) }
        </ul>
      </div>
        <table>
        <tbody>
          <tr>
            <td>
              <label>First name</label>
            </td>
            <td>
              <input name='first_name' value={fields.first_name}
                     onChange={ onFieldChange }/>
            </td>
          </tr>
          <tr>
            <td>
              <label>Last name</label>
            </td>
            <td>
              <input name='last_name' value={fields.last_name}
                     onChange={ onFieldChange }/>
            </td>
          </tr>
          <tr>
            <td>
              &nbsp;
            </td>
            <td>
              <button type='submit' disabled={!valid} >Submit</button>
            </td>
           </tr>
        </tbody>
        </table>
      </form>
      <div className="list">
        <h2>Users</h2>
        <ul>
        { list.map(user => (
          <li key={user.id}>{user.first_name} {user.last_name}</li>)) }
        </ul>
      </div>
    </div>
  );
}
