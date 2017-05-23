import BaseQuery from './base';

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
      let datasets = [`mixpanel`];
      datasets = datasets.concat(data);
      return datasets;
    }
  }
}
