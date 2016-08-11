import React from 'react';

export default function Notify({ messages, queue, onSend }) {
  return (
    <div>
      <button onClick={ onSend }>Create Notification</button>
      <h2>Current Notifications</h2>
      <ul>
        { messages.map(m => (
          <li key={m}>{m}</li> )) }
      </ul>

      <h2>Queued (displayed only to show inner workings)</h2>
      <ul>
        { queue.map(m => (
          <li key={m}>{m}</li> )) }
      </ul>
    </div>
  );
}
