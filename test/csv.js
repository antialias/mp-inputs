import expect from 'expect.js';

import { resultToCSVArray } from '../src/util/csv';


describe(`resultToCSVArray`, function() {
  it(`translates a simple result`, function() {
    const result = {
      headers:[
        '$event',
      ],
      series: {
        'Click run': {
          '2017-01-14T00:00:00Z': 393,
          '2017-01-15T00:00:00Z': 619,
          '2017-01-16T00:00:00Z': 2837,
        },
      },
    };
    const csvArray = resultToCSVArray(result);

    expect(csvArray).to.eql([
      [`Date`,       `Click run`],
      [`2017-01-14`, 393        ],
      [`2017-01-15`, 619        ],
      [`2017-01-16`, 2837       ],
    ]);
  });

  it(`accepts different time buckets`, function() {
    const result = {
      headers:[
        '$event',
      ],
      series: {
        'Click run': {
          '2017-01-14T00:00:00Z': 393,
          '2017-01-14T01:00:00Z': 619,
          '2017-01-14T02:00:00Z': 2837,
        },
      },
    };
    const csvArray = resultToCSVArray(result, {timeUnit: `hour`});

    expect(csvArray).to.eql([
      [`Date`,                `Click run`],
      [`2017-01-14 00:00:00`, 393        ],
      [`2017-01-14 01:00:00`, 619        ],
      [`2017-01-14 02:00:00`, 2837       ],
    ]);
  });

  it(`translates a multi-event result`, function() {
    const result = {
      headers:[
        '$event',
      ],
      series: {
        'Click run': {
          '2017-01-14T00:00:00Z': 393,
          '2017-01-15T00:00:00Z': 619,
          '2017-01-16T00:00:00Z': 2837,
        },
        'Hit homerun': {
          '2017-01-15T00:00:00Z': 15,
          '2017-01-16T00:00:00Z': 32,
          '2017-01-14T00:00:00Z': 636,
        },
      },
    };
    const csvArray = resultToCSVArray(result);

    expect(csvArray).to.eql([
      [`Date`,       `Click run`, `Hit homerun`],
      [`2017-01-14`, 393,         636          ],
      [`2017-01-15`, 619,         15           ],
      [`2017-01-16`, 2837,        32           ],
    ]);
  });

  it(`translates a nested result`, function() {
    const result = {
      headers:[
        '$event',
        '$browser',
      ],
      series: {
        'Click run': {
          'Chrome': {
            '2017-01-14T00:00:00Z': 393,
            '2017-01-15T00:00:00Z': 619,
            '2017-01-16T00:00:00Z': 2837,
          },
          'Firefox': {
            '2017-01-14T00:00:00Z': 15,
            '2017-01-15T00:00:00Z': 6,
            '2017-01-16T00:00:00Z': 316,
          },
          'Safari': {
            '2017-01-14T00:00:00Z': 0,
            '2017-01-15T00:00:00Z': 26,
            '2017-01-16T00:00:00Z': 397,
          },
        },
      },
    };
    const csvArray = resultToCSVArray(result);

    expect(csvArray).to.eql([
      [`Date`,       `Event`,     `Chrome`, `Firefox`, `Safari`],
      [`2017-01-14`, `Click run`, 393,      15,        0       ],
      [`2017-01-15`, `Click run`, 619,      6,         26      ],
      [`2017-01-16`, `Click run`, 2837,     316,       397     ],
    ]);
  });

  it(`translates a deeply nested result`, function() {
    const result = {
      headers:[
        '$event',
        '$browser',
        '$os',
      ],
      series: {
        'Click run': {
          'Chrome': {
            'Mac OS X': {
              '2017-01-14T00:00:00Z': 393,
              '2017-01-15T00:00:00Z': 619,
              '2017-01-16T00:00:00Z': 2837,
            },
            'Linux': {
              '2017-01-14T00:00:00Z': 53,
              '2017-01-15T00:00:00Z': 234,
              '2017-01-16T00:00:00Z': 2313,
            },
          },
          'Firefox': {
            'Mac OS X': {
              '2017-01-14T00:00:00Z': 15,
              '2017-01-15T00:00:00Z': 6,
              '2017-01-16T00:00:00Z': 316,
            },
            'Linux': {
              '2017-01-14T00:00:00Z': 43,
              '2017-01-15T00:00:00Z': 233,
              '2017-01-16T00:00:00Z': 123,
            },
          },
          'Safari': {
            'Mac OS X': {
              '2017-01-14T00:00:00Z': 0,
              '2017-01-15T00:00:00Z': 26,
              '2017-01-16T00:00:00Z': 397,
            },
          },
        },
      },
    };
    const csvArray = resultToCSVArray(result);

    expect(csvArray).to.eql([
      [`Date`,       `Event`,     `Browser`, `Linux`, `Mac OS X`],
      [`2017-01-14`, `Click run`, `Chrome`,  53,      393       ],
      [`2017-01-14`, `Click run`, `Firefox`, 43,      15        ],
      [`2017-01-14`, `Click run`, `Safari`,  0,       0         ],
      [`2017-01-15`, `Click run`, `Chrome`,  234,     619       ],
      [`2017-01-15`, `Click run`, `Firefox`, 233,     6         ],
      [`2017-01-15`, `Click run`, `Safari`,  0,       26        ],
      [`2017-01-16`, `Click run`, `Chrome`,  2313,    2837      ],
      [`2017-01-16`, `Click run`, `Firefox`, 123,     316       ],
      [`2017-01-16`, `Click run`, `Safari`,  0,       397       ],
    ]);
  });

  it(`handles simple non-timeseries data`, function() {
    const result = {
      headers:[
        '$people',
      ],
      series: {
        '$all_people': {
          'Invalid date': 807923,
        },
      },
    };
    const csvArray = resultToCSVArray(result, {timeseries: false});

    expect(csvArray).to.eql([
      [`All People`],
      [807923      ],
    ]);
  });

  it(`handles grouped non-timeseries data`, function() {
    const result = {
      headers:[
        '$people',
        '$country_code',
      ],
      series: {
        'CSV exports': {
          'US': {
            'Invalid date': 505453,
          },
          'IN': {
            'Invalid date': 80435,
          },
        },
      },
    };
    const csvArray = resultToCSVArray(result, {timeseries: false});

    expect(csvArray).to.eql([
      [`People`,      `India`, `United States`],
      [`CSV exports`, 80435,   505453         ],
    ]);
  });

  it(`handles multi-prop grouped non-timeseries data`, function() {
    const result = {
      headers:[
        '$people',
        '$country_code',
      ],
      series: {
        'CSV exports': {
          'US': {
            'Invalid date': 505453,
          },
          'IN': {
            'Invalid date': 80435,
          },
        },
        'Current tally': {
          'US': {
            'Invalid date': 15,
          },
          'IN': {
            'Invalid date': 3,
          },
        },
      },
    };
    const csvArray = resultToCSVArray(result, {timeseries: false});

    expect(csvArray).to.eql([
      [`People`,        `India`, `United States`],
      [`CSV exports`,   80435,   505453         ],
      [`Current tally`, 3,       15             ],
    ]);
  });
});
