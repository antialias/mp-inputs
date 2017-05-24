import BaseQuery from './base';

export class EventDefinitionsQuery extends BaseQuery {
  constructor() {
    super(...arguments);
    this.requestMethod = `GET`;
  }

  buildUrl() {
    return `api/app/data_definitions/${this.projectId}/event-definitions/`;
  }
}
