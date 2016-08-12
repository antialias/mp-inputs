export const API_BASE = process.env.API_BASE || 'https://mixpanel.com';

export function authHeader(apiSecret) {
  return `Basic ${new Buffer(apiSecret + ':', 'binary').toString('base64')}`;
}

export function urlencodeParams(params) {
  return Object.keys(params)
    .reduce((items, pkey) => items.concat(`${pkey}=${encodeURIComponent(params[pkey])}`), [])
    .join('&');
}
