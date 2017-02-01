/* global mp */

// TODO
// clean up and consolidate this garbage with the OAuth API
// of Dashboard, so that we can get a single shared way
// to interact with MP context/APIs that's efficient when
// it can be but still works when app runs standalone

export default class MPContext {
  constructor() {
    this.standalone = typeof mp === `undefined`;

    if (!this.standalone) {
      this.accessToken = mp.report.globals.access_token;
      this.apiKey = mp.report.globals.api_key;
      this.apiSecret = mp.report.globals.api_secret;
      this.bookmarks = mp.report.globals.bookmarks;
      this.customEvents = mp.report.globals.custom_events;
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
      this.whitelists = mp.report.globals.whitelists;
    }
  }
}
