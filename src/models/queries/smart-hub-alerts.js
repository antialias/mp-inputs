import {extend} from 'mixpanel-common/util';

import BaseQuery from './base';

export default class SmartHubAlertsQuery extends BaseQuery {
  fetch(endpoint, params, queryOptions) {
    const fetchOptions = {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
      },
      method: this.requestMethod,
      body: JSON.stringify(params),
    };

    const url = `${this.apiHost}/${endpoint}`;
    return fetch(url, extend(fetchOptions, queryOptions))
      .then(response => {
        if (response.ok || response.body) {
          return response.json();
        } else {
          this.handleFetchError(response.statusText, url);
          return {error: response.statusText};
        }
      })
      .catch(err => this.handleFetchError(err, url));
  }

  buildQuery(state) {
    return {
      alertContentIds: state.report.alertContentIds,
    };
  }

  buildUrl() {
    return `api/app/smart_hub/${this.projectId}/get_alerts_by_content_ids`;
  }

  buildParams() {
    return {
      'alert_content_ids': this.query.alertContentIds,
    };
  }

  processResults(results) {
    return results.results.alerts;
  }
}
