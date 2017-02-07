import expect from 'expect.js';

import { extremaResultToBuckets } from '../src/models/queries/extrema.js';

describe('extremaResultToBuckets', function() {
    it('does not return buckets when differential is low', function() {
        const result = {min: 0, max: 9};
        expect(extremaResultToBuckets(result)).to.eql({});
    });

    it('handles >= 1 bucket_size correctly', function() {
        const result = {
            min: 0,
            max: 40,
        };
        expect(extremaResultToBuckets(result)).to.eql({
            buckets: [0, 4, 8, 12, 16, 20, 24, 28, 32, 36],
            bucketRanges: {
              0: [ 0, 4 ],
              4: [ 4, 8 ],
              8: [ 8, 12 ],
              12: [ 12, 16 ],
              16: [ 16, 20 ],
              20: [ 20, 24 ],
              24: [ 24, 28 ],
              28: [ 28, 32 ],
              32: [ 32, 36 ],
              36: [ 36, 40 ],
            },
        });
    });

    // it('handles < 1 bucket_size correctly', function() {
    //     const result = {
    //         cardinality: 'high',
    //         bucket_size: 0.5,
    //         min: 0,
    //         max: 10,
    //         multiplier: 4,
    //     };
    //     expect(extremaResultToBuckets(result)).to.eql({
    //         buckets: [0, 2, 4, 6, 8, 10, 12],
    //         bucketRanges: {
    //             0: [0, 2],
    //             2: [2, 4],
    //             4: [4, 6],
    //             6: [6, 8],
    //             8: [8, 10],
    //             10: [10, 12],
    //             12: [12, 14],
    //         },
    //     });
    // });
});
