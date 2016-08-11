import { connect } from 'react-redux';
import React from 'react';
import logo from './logo.svg';
import './App.css';
import { component as Notify,
         selectors as notifySel,
         actions as notifyActions,
         MAX_DISPLAY, DISPLAY_TIME } from './notify/index';
const { notifyCreate } = notifyActions;

export function App({ notifyMsgs, notifyQueue, notifyCreate }) {
  return (
      <div className="App">
        <div className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h2>Notifications</h2>
        </div>
        <div className="notifyDiv">
          <div className="desc">
      <p>Demonstrates how redux-logic can implement a custom notification system where only <b>{MAX_DISPLAY} messages</b> will be displayed on screen for <b>{DISPLAY_TIME/1000} seconds</b>. The other pending messages will be placed in a queue to be rotated in as the others expire. In a real app the queue would not be displayed, but to help show how this works, the queue is displayed along with the current notifications.
            </p>
      <p><b>Usage:</b> Click on the create message button repeatedly to generate unique messages (in this case just a unique ID). You will see the message show up in Current Notifications if there is room otherwise they will queue and be displayed as the others expire.
            </p>
            <p>The logic code for this example lives in <code>src/notify/logic.js</code>. The logic middleware setup is in <code>src/configureStore.js</code>
            </p>
          </div>

          <div className="main">
      <Notify messages={notifyMsgs} queue={notifyQueue} onSend={notifyCreate} />
          </div>
        </div>
      </div>
  );
}

const enhance = connect(
  state => ({
    notifyMsgs: notifySel.messages(state),
    notifyQueue: notifySel.queue(state)
  }),
  {
    notifyCreate
  }
);

export default enhance(App);
