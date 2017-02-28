/* global API_LOCAL, mp */

import { objToQueryString } from 'mixpanel-common/util';

// TODO
// clean up and consolidate this garbage with the OAuth API
// of Dashboard, so that we can get a single shared way
// to interact with MP context/APIs that's efficient when
// it can be but still works when app runs standalone

export default class MPContext {
  constructor() {
    this.standalone = typeof mp === `undefined`;
    this.apiHost = `https://mixpanel.com`;

    if (!this.standalone) {
      // global garbage
      this.accessToken = mp.report.globals.access_token;
      this.appName = mp.report.globals.app_name;
      this.bookmarks = mp.report.globals.bookmarks;
      this.customEvents = mp.report.globals.custom_events;
      this.dashboardTags = mp.report.globals.dashboard_tags;
      this.featureGates = mp.report.globals.feature_gates;
      this.flags = mp.report.globals.flags;
      this.hasIntegratedArb = mp.report.globals.has_integrated_arb;
      this.hasPermissions = mp.report.globals.project_featureflags.includes(`permissions`);
      this.permissions = mp.report.globals.permissions;
      this.projectID = mp.report.globals.project_id;
      this.setupURL = mp.report.globals.setup_mixpanel_url;
      this.userEmail = mp.report.globals.user_email;
      this.userID = mp.report.globals.user_id;
      this.userName = mp.report.globals.user_name;
      this.utcOffset = mp.report.globals.utc_offset;
      this.whitelists = mp.report.globals.whitelists;

      // API access
      if (API_LOCAL) {
        this.apiHost = window.location.origin;
      } else if (window.location.origin.match(/^https:\/\/stage.*\.mixpanel\.com$/)) {
        // TMP hack so staging talks local
        this.apiHost = window.location.origin;
      }
      this.accessToken = mp.report.globals.access_token;
      this.apiKey = mp.report.globals.api_key;
      this.apiSecret = mp.report.globals.api_secret;
      this.bmURL = `${this.apiHost}/report/${this.projectID}/bookmarks/${this.appName}`;
      this.bookmarkCountUrl = `${this.apiHost}/report/${this.projectID}/bookmarks/limited_count`;
    } else {
      this.utcOffset = -480;
    }
  }

  deleteBookmark(id) {
    return fetch(`${this.bmURL}/delete/${id}`, {
      credentials: `same-origin`,
      method: `DELETE`,
    });
  }

  saveBookmark(data) {
    if (this.standalone) {
      return Promise.reject(`Cannot save report in standalone mode yet. Will OAuth it soon.`);
    }

    const endpoint = data.id ? `update/${data.id}` : `create/`;
    const reportLimit = this.featureGates.max_saved_reports;

    // TODO: cassie: fix API on analytics end so we don't have to chain calls
    return fetch(this.bookmarkCountUrl, {
      credentials: `same-origin`,
      method: `GET`,
    })
      .then(res => res.json())
      .then(res => {
        if (res.error) {
          throw new Error(res.error);
        }
        return res.bookmark_count;
      })
      .then(count => {
        if (count >= reportLimit) {
          throw new Error(`At saved report limit`);
        } else {
          return count;
        }
      })
      .then(() => {
        return this.post(`${this.bmURL}/${endpoint}`, {
          name: data.name,
          params: JSON.stringify(data),
          icon: data.icon,
        });
      })
      .then(res => res.json())
      .then(res => {
        if (res.error) {
          throw new Error(res.error);
        }
        this.bookmarks.push(res.bookmark)
        return res.bookmark;
      });
  }

  setFlag(flag) {
    if (!this.flags[flag]) {
      this.flags[flag] = mp.report.globals.flags[flag] = 1;
      this.post(`${this.apiHost}/set_flag/`, {flag});
    }
  }

  post(url, data) {
    return fetch(url, {
      body: objToQueryString(data),
      credentials: `same-origin`,
      headers: {
        'Content-Type': `application/x-www-form-urlencoded; charset=utf-8`,
      },
      method: `POST`,
    });
  }
}
