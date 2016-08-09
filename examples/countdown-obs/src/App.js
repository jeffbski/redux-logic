import { connect } from 'react-redux';
import React from 'react';
import logo from './logo.svg';
import './App.css';
import { component as Timer,
         selectors as timerSel,
         actions as timerActions } from './timer/index';
const { timerStart, timerCancel, timerReset } = timerActions;

export function App({ timerValue, timerStatus, timerStart, timerCancel, timerReset }) {
  return (
      <div className="App">
        <div className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h2>Countdown-obs</h2>
        </div>
        <div className="timerDiv">
          <div className="desc">
      <p>Demonstrates how redux-logic can create long running logic that dispatches over time, in this case it is a simple countdown timer implemented using Rx.Observable.interval.
            </p>
      <p><b>Usage:</b> Click on start, cancel, and reset buttons to interact with the countdown timer.
            </p>
            <p>The logic code for this example lives in <code>src/timer/logic.js</code>. The logic middleware setup is in <code>src/configureStore.js</code>
            </p>
          </div>

          <div className="main">
            <Timer status={timerStatus} value={timerValue}
                   onStart={timerStart} onStop={timerCancel}
                   onReset={timerReset} />
          </div>
        </div>
      </div>
  );
}

const enhance = connect(
  state => ({
    timerValue: timerSel.value(state),
    timerStatus: timerSel.status(state)
  }),
  {
    timerStart,
    timerCancel,
    timerReset
  }
);

export default enhance(App);
