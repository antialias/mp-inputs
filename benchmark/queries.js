// Secrets are not checked in. API_SECRETS maps project IDs to api secrets:
// { projectID: secret, projectID: secret, ... }
import API_SECRETS from './project-secrets';

const QUERIES = [
  {
    project: 3,
    queries: [
      {events: ['Viewed report']},
      {events: ['Segmentation query']},
    ],
    time: {
      // TODO
    },
  },
];
for (const query of QUERIES) {
  query.apiSecret = API_SECRETS[query.project];
}

export default QUERIES;
