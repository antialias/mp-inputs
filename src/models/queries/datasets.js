import BaseQuery from './base';
import {capitalize, extend} from '../../util';
import {DATASETS, DATASET_MIXPANEL} from '../constants';

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
      return [];
    }

    if (results.data.length) {
      let datasets = Object.assign(...results.data.map(dataset => ({
        [dataset]: DATASETS[dataset] || {
          displayName: capitalize(dataset),
        },
      })));

      // Implicitly include mixpanel dataset
      datasets = extend(datasets, {
        [DATASET_MIXPANEL]: DATASETS[DATASET_MIXPANEL],
      });

      return datasets;
    }
  }
}
