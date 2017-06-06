/* global afterEach, beforeEach, describe, it */

import {setupAppAsync} from '../insights-util';

import './insights-builder';

describe(`fully integrated insights-app`, function() {
  beforeEach(async function() {
    this.app = await setupAppAsync();
  });

  it(`renders main sections`, function() {
    for (const section of [`insights-header`, `insights-builder`, `insights-result`, `insights-reports`]) {
      console.log(this.app);
      expect(this.app.querySelector(section)).to.be.ok;
    }
  });
});
