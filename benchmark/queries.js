import fs from 'fs';
import { TimeClause } from '../src/models/clause';

// Secrets are not checked in. API_SECRETS maps project IDs to api secrets:
// { projectID: secret, projectID: secret, ... }
const API_SECRETS = JSON.parse(fs.readFileSync('/etc/secrets/irb/project-secrets.json', 'utf8'));

let QUERIES = [
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
    name: '1 high-cardinality numeric groupBy',
    project: 620033,
    queries: [
      {events: ['Export request finished']},
    ],
    time: {
      range: TimeClause.RANGES.YEAR,
    },
    groups: [
      {
        value: 'date_range',
        resourceType: 'event',
        filterType: 'number',
      },
    ],
  },
  {
    name: '2 high-cardinality numeric groupBys',
    project: 620033,
    queries: [
      {events: ['Export request finished']},
    ],
    time: {
      range: TimeClause.RANGES.YEAR,
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
  {
    name: '1 string groupBy',
    project: 620033,
    queries: [
      {events: ['Export request finished']},
    ],
    time: {
      range: TimeClause.RANGES.HOURS,
    },
    groups: [
      {
        value: 'auth',
        resourceType: 'event',
        filterType: 'string',
      },
    ],
  },
  {
    name: '2 string groupBy',
    project: 620033,
    queries: [
      {events: ['Export request finished']},
    ],
    time: {
      range: TimeClause.RANGES.HOURS,
    },
    groups: [
      {
        value: 'auth',
        resourceType: 'event',
        filterType: 'string',
      },
      {
        value: 'host',
        resourceType: 'event',
        filterType: 'string',
      },
    ],
  },
];

const OPERATORS_AVAILABLE_FOR_QUERY_TYPE = {
  average: { JQL: true, Seg: true },
  total: { JQL: true, Seg: true },
  min: { JQL: true, Seg: true },
  max: { JQL: true, Seg: true },
  unique: { JQL: false, Seg: false },
  median: { JQL: true, Seg: false },
}

// operators for numeric properties
QUERIES = QUERIES.concat(Object.keys(OPERATORS_AVAILABLE_FOR_QUERY_TYPE).map(operator => {
  return {
    disableForJQL: !OPERATORS_AVAILABLE_FOR_QUERY_TYPE[operator]['JQL'],
    disableForSeg: !OPERATORS_AVAILABLE_FOR_QUERY_TYPE[operator]['Seg'],
    name: `${operator} of 'unsent' on 'batch' in the ${TimeClause.RANGES.HOURS}`,
    project: 258190,
    queries: [
      {
        events: ['batch'],
        type: operator,
        property: {
          value: 'unsent',
          resourceType: 'event',
        }
      },
    ],
    time: {
      range: TimeClause.RANGES.HOURS,
    },
  };
}));
for (const query of QUERIES) {
  query.apiSecret = API_SECRETS[query.project];
}

export default QUERIES;
