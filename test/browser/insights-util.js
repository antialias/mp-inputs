import queryString from 'query-string';
import * as sinon from 'sinon';

import initInsights from '../../src/init';
import {conditionAsync, nextAnimationFrame} from './util';

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

export async function currentScreenAsync(container, screenName) {
  let currentScreen = null;
  await conditionAsync(() => {
    const screens = container.querySelectorAll(`[screen-index]`);
    currentScreen = screens.length ? screens[screens.length - 1] : null;
    return !!(currentScreen && currentScreen.tagName.toLowerCase() === screenName.toLowerCase());
  });
  return currentScreen;
}


export async function setupAppAsync({
  apiOverrides=(url, params) => null,
}={}) {
  await teardownAppIfNecessaryAsync();

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
  await nextAnimationFrame();

  return app;
}

async function teardownAppIfNecessaryAsync() {
  if (window.fetch.hasOwnProperty(`restore`)) {
    window.fetch.restore();
  }
  document.body.innerHTML = ``;
  await nextAnimationFrame();
}
