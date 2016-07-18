// Secrets are not checked in. API_SECRETS maps project IDs to api secrets:
// { projectID: secret, projectID: secret, ... }
import API_SECRETS from '/etc/secrets/irb/project-secrets';
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
  {
    name: 'high-cardinality numeric groupBys',
    project: 620033,
    queries: [
      {events: ['Export request finished']},
    ],
    time: {
      range: TimeClause.RANGES.HOURS,
    },
    groups: [
      {
        value: 'date_range',
        resourceType: 'event',
        filterType: 'number',
      },
      {
        value: 'decompressed / scped * 100',
        resourceType: 'event',
        filterType: 'number',
      },
    ],
  },
];
for (const query of QUERIES) {
  query.apiSecret = API_SECRETS[query.project];
}

export default QUERIES;
