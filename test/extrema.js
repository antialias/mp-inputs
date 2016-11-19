import expect from 'expect.js';

import { extremaResultToBuckets } from '../src/models/queries/extrema.js';

describe('extremaResultToBuckets', function() {
    it('does not return buckets when no cardinality is present', function() {
        const result = {};
        expect(extremaResultToBuckets(result)).to.eql({});
    });

    it('does not return buckets when cardinality is not high', function() {
        const result = {cardinality: 'low'};
        expect(extremaResultToBuckets(result)).to.eql({});
    });

    it('handles >= 1 bucket_size correctly', function() {
        const result = {
            cardinality: 'high',
            bucket_size: 20,
            min: 0,
            max: 100,
        };
        expect(extremaResultToBuckets(result)).to.eql({
            buckets: [0, 20, 40, 60, 80, 100, 120],
            bucketRanges: {
                0: [0, 20],
                20: [20, 40],
                40: [40, 60],
                60: [60, 80],
                80: [80, 100],
                100: [100, 120],
                120: [120, 140],
            },
        });
    });

    it('handles < 1 bucket_size correctly', function() {
        const result = {
            cardinality: 'high',
            bucket_size: 0.5,
            min: 0,
            max: 10,
            multiplier: 4,
        };
        expect(extremaResultToBuckets(result)).to.eql({
            buckets: [0, 2, 4, 6, 8, 10, 12],
            bucketRanges: {
                0: [0, 2],
                2: [2, 4],
                4: [4, 6],
                6: [6, 8],
                8: [8, 10],
                10: [10, 12],
                12: [12, 14],
            },
        });
    });
});
