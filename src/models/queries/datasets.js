import BaseQuery from './base';
import {capitalize} from '../../util';

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

    const data = results.data;
    if (data.length) {
      // Implicitly include mixpanel dataset
      let datasets = [{
        displayName: `Mixpanel`,
        datasetName: ``,
      }];

      datasets = datasets.concat(data.map(dataset => ({
        displayName: capitalize(dataset),
        datasetName: dataset,
      })));

      return datasets;
    }
  }
}
