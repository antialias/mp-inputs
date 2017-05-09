import queryString from 'query-string';
import * as sinon from 'sinon';

import initInsights from '../../src/init';
import {Async} from './util';

function validResponse(response) {
  return Promise.resolve(new Response(JSON.stringify(response), {
    status: 200,
    headers: {
      'Content-Type': `application/json`,
    },
  }));
}

function invalidResponse(url) {
  const jsonStr = JSON.stringify({
    request: url,
    error: `Unsupported endpoint`,
  });
  return Promise.resolve(new Response(jsonStr, {
    status: 400,
    headers: {
      'Content-Type': `application/json`,
    },
  }));
}

export async function setupApp({
  apiOverrides=(url, params) => null,
}={}) {
  await teardownAppIfNecessary();

  sinon.stub(window, `fetch`, (url, options) => {
    const params = queryString.parse(options.body);
    const response = apiOverrides(url, params);
    if (response) {
      return validResponse(response);
    } else if (url.indexOf(`/api/2.0/engage/properties`) !== -1) {
      return validResponse({results: {}});
    } else if (url.indexOf(`/api/2.0/engage/values`) !== -1) {
      return validResponse({results: []});
    } else if (url.indexOf(`/api/2.0/events/properties/toptypes`) !== -1) {
      return validResponse({});
    } else if (url.indexOf(`/api/2.0/events/names`) !== -1) {
      return validResponse([]);
    } else if (url.indexOf(`/api/2.0/events/properties/values`) !== -1) {
      return validResponse([]);
    } else if (url.indexOf(`/api/2.0/insights`) !== -1) {
      return validResponse({
        headers: [],
        series: {},
      });
    }

    return invalidResponse(url);
  });

  const app = await initInsights();
  app.apiSecret = `test_secret`;
  app.accessToken = `test_token`;
  app.projectID = 3;
  document.body.innerHTML = ``;
  document.body.appendChild(app);
  await Async.nextAnimationFrame();

  return app;
}

async function teardownAppIfNecessary() {
  if (window.fetch.hasOwnProperty(`restore`)) {
    window.fetch.restore();
  }
  document.body.innerHTML = ``;
  await Async.nextAnimationFrame();
}
