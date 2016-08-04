import React from 'react';

export default function Timer({ status, value, onStart, onStop, onReset }) {
  return (
    <div>
      <div>Remaining time: { value }</div>
      <div>Status: { status }</div>
      <button onClick={ onStart }>Start</button>
      <button onClick={ onStop }>Stop</button>
      <button onClick={ onReset }>Reset</button>
    </div>
  );
}
