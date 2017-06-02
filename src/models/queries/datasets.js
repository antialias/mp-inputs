import BaseQuery from './base';
import {capitalize} from '../../util';
import {DATASETS} from '../constants';

export default class DatasetsQuery extends BaseQuery {
  constructor(apiAttrs, options = {}) {
    super(apiAttrs, options);

    this.requestMethod = `GET`;
    this.includeCredentials = true;
  }

  buildUrl() {
    return `projects/${this.projectId}/sst/datasets`;
  }

  processResults(results) {
    if (results.errorMessage) {
      console.error(`Datasets API error: ${results.errorMessage}`);
    }

    if (results.data.length) {
      return Object.assign(...results.data.map(dataset => ({
        [dataset]: DATASETS[dataset] || {
          displayName: capitalize(dataset),
          description: ``,
        },
      })));
    }

    return {};
  }
}
