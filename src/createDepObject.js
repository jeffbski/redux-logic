export default function createDepObject({deps, cancelled$, ctx, getState, action, action$}) {
  return {
    ...deps,
    cancelled$,
    ctx,
    getState,
    action,
    action$
  };
}
