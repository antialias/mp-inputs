import fs from 'fs';
import { TimeClause } from '../src/models/clause';

// Secrets are not checked in. API_SECRETS maps project IDs to api secrets:
// { projectID: secret, projectID: secret, ... }
const API_SECRETS = JSON.parse(fs.readFileSync('/etc/secrets/irb/project-secrets.json', 'utf8'));

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
  // {
  //   name: 'simple segmentation',
  //   project: 620033,
  //   queries: [
  //     {events: ['Export request finished']},
  //   ],
  //   time: {
  //     range: TimeClause.RANGES.HOURS,
  //   },
  // },
  // {
  //   name: '1 string groupBys',
  //   project: 620033,
  //   queries: [
  //     {events: ['Export request finished']},
  //   ],
  //   time: {
  //     range: TimeClause.RANGES.HOURS,
  //   },
  //   groups: [
  //     {
  //       value: 'auth',
  //       resourceType: 'event',
  //       filterType: 'string',
  //     },
  //   ],
  // },
  // {
  //   name: '2 string groupBys',
  //   project: 620033,
  //   queries: [
  //     {events: ['Export request finished']},
  //   ],
  //   time: {
  //     range: TimeClause.RANGES.HOURS,
  //   },
  //   groups: [
  //     {
  //       value: 'auth',
  //       resourceType: 'event',
  //       filterType: 'string',
  //     },
  //     {
  //       value: 'host',
  //       resourceType: 'event',
  //       filterType: 'string',
  //     },
  //   ],
  // },
].concat(['average', 'total', 'min', 'max'].map(type => {
  return {
    name: `${type} of 'unsent' on 'batch' in the ${TimeClause.RANGES.HOURS}`,
    project: 258190,
    queries: [
      {
        events: ['batch'],
        type: type,
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
