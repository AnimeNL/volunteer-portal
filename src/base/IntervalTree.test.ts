// Copyright 2021 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

import { IntervalTree, IntervalTreeNode } from './IntervalTree';

describe('IntervalTree', () => {
    it('is able to construct a segment tree from numbers, and query them accurately', () => {
        const tree = new IntervalTree([
            { start: 2, end: 20 },
            { start: 10, end: 25 },
            { start: 15, end: 30 },
        ]);

        expect(tree.query({ point: -1 })).toHaveLength(0);
        expect(tree.query({ point: 0 })).toHaveLength(0);
        expect(tree.query({ point: 2 })).toHaveLength(1);  // [ 2, 20 ]
        expect(tree.query({ point: 10 })).toHaveLength(2);  // [ 2, 20 ], [ 10, 25 ]
        expect(tree.query({ point: 16 })).toHaveLength(3);  // [ 2, 20 ], [ 10, 25 ], [ 15, 30 ]
        expect(tree.query({ point: 21 })).toHaveLength(2);  // [ 10, 25 ], [ 15, 30 ]
        expect(tree.query({ point: 25 })).toHaveLength(1);  // [ 15, 30 ]
        expect(tree.query({ point: 30 })).toHaveLength(0);
        expect(tree.query({ point: 35 })).toHaveLength(0);

        expect(tree.query({ start: 0, end: 1 })).toHaveLength(0);
        expect(tree.query({ start: 0, end: 5 })).toHaveLength(1);  // [ 2, 20 ]
        expect(tree.query({ start: 0, end: 10 })).toHaveLength(1);  // [ 2, 20 ]
        expect(tree.query({ start: 0, end: 15 })).toHaveLength(2);  // [ 2, 20 ], [ 10, 15 ]
        expect(tree.query({ start: 10, end: 15 })).toHaveLength(2);  // [ 2, 20 ], [ 10, 25 ]
        expect(tree.query({ start: 10, end: 16 })).toHaveLength(3);  // all of them
        expect(tree.query({ start: 29, end: 30 })).toHaveLength(1);  // [ 15, 30 ]
        expect(tree.query({ start: 30, end: 35 })).toHaveLength(0);

        expect(tree.query({ point: Infinity })).toHaveLength(0);
        expect(tree.query({ point: NaN })).toHaveLength(0);

        expect(tree.query({ start: Infinity, end: -Infinity })).toHaveLength(0);
        expect(tree.query({ start: 30, end: 0 })).toHaveLength(0);
    });

    it('does not depend on ordering of values passed to the tree constructor', () => {
        const tree = new IntervalTree([
            { start: 15, end: 30 },
            { start: 2, end: 20 },
            { start: 10, end: 25 },
        ]);

        expect(tree.query({ point: -1 })).toHaveLength(0);
        expect(tree.query({ point: 0 })).toHaveLength(0);
        expect(tree.query({ point: 2 })).toHaveLength(1);  // [ 2, 20 ]
        expect(tree.query({ point: 10 })).toHaveLength(2);  // [ 2, 20 ], [ 10, 25 ]
        expect(tree.query({ point: 16 })).toHaveLength(3);  // [ 2, 20 ], [ 10, 25 ], [ 15, 30 ]
        expect(tree.query({ point: 21 })).toHaveLength(2);  // [ 10, 25 ], [ 15, 30 ]
        expect(tree.query({ point: 25 })).toHaveLength(1);  // [ 15, 30 ]
        expect(tree.query({ point: 30 })).toHaveLength(0);
        expect(tree.query({ point: 35 })).toHaveLength(0);
    });

    it('is faster than a brute-force implementation, yet produces the same results', () => {
        const kIntervals = 1_000;         // number of intervals to consider
        const kIterations = 100_000;      // number of iterations to run

        const kRangeMinimum = 0;          // minimum value in the interval range
        const kRangeMaximum = 1_000_000;  // maximum value in the interval range
        const kMaximumWidth = 10_000;     // maximum width of an individual interval

        function clampedRandom(min: number, max: number): number {
            return Math.floor(Math.random() * (max - min) + min);
        }

        const intervals: IntervalTreeNode[] = [];
        const searches: number[] = [];

        // (1) Build |kIntervals| individual intervals within the predefined ranges.
        for (let index = 0; index < kIntervals; ++index) {
            const start = clampedRandom(kRangeMinimum, kRangeMaximum);
            const end = clampedRandom(start + 1, start + kMaximumWidth);

            intervals.push({ start, end });
        }

        for (let index = 0; index < kIterations; ++index)
            searches.push(clampedRandom(kRangeMaximum, kRangeMaximum));

        // (2) Build an IntervalTree instance based on the |intervals|, and query it |kIterations|x.
        const tree = new IntervalTree(intervals);

        let intervalTreeResults: number[] = [];
        let intervalTreeTimeNs: bigint;
        {
            const startTimeNs = process.hrtime.bigint();
            for (const point of searches)
                intervalTreeResults.push(tree.query({ point }).length);

            intervalTreeTimeNs = process.hrtime.bigint() - startTimeNs;
        }

        // (3) Build a sorted list of |intervals|, and execute |kIterations| brute-force searches.
        const sortedIntervals = intervals.sort((lhs, rhs) => lhs.start - rhs.start);

        let bruteForceResults: number[] = [];
        let bruteForceTimeNs: bigint;
        {
            const startTimeNs = process.hrtime.bigint();
            for (const point of searches) {
                let matches = 0;
                for (const interval of sortedIntervals) {
                    if (interval.start <= point && interval.end > point)
                        ++matches;
                }

                bruteForceResults.push(matches);
            }

            bruteForceTimeNs = process.hrtime.bigint() - startTimeNs;
        }

        // (4) Confirm that the results are identical, then that the interval tree was sufficiently
        // faster than the brute force approach on this test.
        expect(intervalTreeResults).toEqual(bruteForceResults);
        expect(intervalTreeTimeNs).toBeLessThan(bruteForceTimeNs);
    });
});
