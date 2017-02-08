import expect from 'expect.js';

import { extremaResultToBuckets } from '../src/models/queries/extrema.js';

describe('extremaResultToBuckets', function() {
    it('does not return buckets when differential is low', function() {
        const result = {min: 0, max: 9};
        expect(extremaResultToBuckets(result)).to.eql({});
    });

    it('handles standard range correctly', function() {
        const result = {
            min: 0,
            max: 40,
        };
        expect(extremaResultToBuckets(result)).to.eql({
            buckets: [0, 4, 8, 12, 16, 20, 24, 28, 32, 36],
            bucketRanges: {
              0: [0, 4],
              4: [4, 8],
              8: [8, 12],
              12: [12, 16],
              16: [16, 20],
              20: [20, 24],
              24: [24, 28],
              28: [28, 32],
              32: [32, 36],
              36: [36, 40],
            },
        });
    });

    it('handles large non-zero min range correctly', function() {
        const result = {
            min: 1500,
            max: 49503,
        };
        expect(extremaResultToBuckets(result)).to.eql({
            buckets: [
              1500,
              6300,
              11100,
              15900,
              20701,
              25501,
              30301,
              35102,
              39902,
              44702,
            ],
            bucketRanges: {
              1500: [1500, 6300],
              6300: [6300, 11100],
              11100: [11100, 15900],
              15900: [15900, 20700],
              20701: [20701, 25501],
              25501: [25501, 30301],
              30301: [30301, 35101],
              35102: [35102, 39902],
              39902: [39902, 44702],
              44702: [44702, 49503],
            },
        });
    });
});
