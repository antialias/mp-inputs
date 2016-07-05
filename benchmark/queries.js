// Secrets are not checked in. API_SECRETS maps project IDs to api secrets:
// { projectID: secret, projectID: secret, ... }
import API_SECRETS from './project-secrets';
import { TimeClause } from '../src/models/clause';

const QUERIES = [
  {
    name: '2 simultaneous',
    project: 3,
    queries: [
      {events: ['Viewed report']},
      {events: ['Segmentation query']},
    ],
    time: {
      range: TimeClause.RANGES.MONTH,
    },
  },
  {
    name: 'simple 96 hours',
    project: 3,
    queries: [
      {events: ['Viewed report']},
    ],
    time: {
      range: TimeClause.RANGES.HOURS,
    },
  },
  {
    name: 'unique 1 quarter',
    project: 3,
    queries: [
      {
        events: ['Segmentation query'],
        type: 'unique',
      },
    ],
    time: {
      range: TimeClause.RANGES.QUARTER,
    },
  },
  {
    name: 'Twitch x 2',
    project: 22604,
    queries: [
      {events: ['minute-watched']},
      {events: ['message-sent']},
    ],
    time: {
      range: TimeClause.RANGES.MONTH,
    },
  },
];
for (const query of QUERIES) {
  query.apiSecret = API_SECRETS[query.project];
}

export default QUERIES;
