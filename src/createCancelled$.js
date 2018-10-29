import { Subject, timer } from 'rxjs';
import { defaultIfEmpty, tap, take, takeUntil } from 'rxjs/operators';

const NODE_ENV = (typeof window  === 'undefined' && process && process.env && process.env.NODE_ENV) ? process.env.NODE_ENV : '';

// returns { cancelled$, setInterceptComplete }
export default function createCancelled$({ action, cancel$, monitor$, logic }) {
  const { name } = logic;
  // once action reaches bottom, filtered, nextDisp, or cancelled
  let interceptComplete = false;

  function setInterceptComplete() {
    interceptComplete = true;
  }

  const cancelled$ = (new Subject()).pipe(
    take(1)
  );
  if (cancel$) {
    cancel$.subscribe(cancelled$); // connect cancelled$ to cancel$
    cancelled$
      .subscribe(
        () => {
          if (!interceptComplete) {
            monitor$.next({ action, name, op: 'cancelled' });
          } else { // marking these different so not counted twice
            monitor$.next({ action, name, op: 'dispCancelled' });
          }
        }
      );
  }

  createWarnTimeout({ logic, cancelled$ });

  return {
    cancelled$,
    setInterceptComplete
  };
}

function createWarnTimeout({ logic, cancelled$ }) {
  const { name, warnTimeout } = logic;

  // In non-production mode only we will setup a warning timeout that
  // will console.error if logic has not completed by the time it fires
  // warnTimeout can be set to 0 to disable
  if (NODE_ENV !== 'production' && warnTimeout) {
    timer(warnTimeout).pipe(
      // take until cancelled, errored, or completed
      takeUntil(cancelled$.pipe(defaultIfEmpty(true))),
      tap(() => {
        // eslint-disable-next-line no-console
        console.error(`warning: logic (${name}) is still running after ${warnTimeout / 1000}s, forget to call done()? For non-ending logic, set warnTimeout: 0`);
      })
    ).subscribe();
  }

}
