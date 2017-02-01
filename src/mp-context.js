/* global mp */

// TODO
// clean up and consolidate this garbage with the OAuth API
// of Dashboard, so that we can get a single shared way
// to interact with MP context/APIs that's efficient when
// it can be but still works when app runs standalone

export const STANDALONE = typeof mp === `undefined`;

export function getMPData() {
  return {
    apiKey: mp.report.globals.api_key,
    apiSecret: mp.report.globals.api_secret,
  };
}
