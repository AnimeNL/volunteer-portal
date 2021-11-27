// Copyright 2021 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

/**
 * Interface defining the requirements of an interval node; each node must have a given start value
 * (inclusive) and an end value (exclusive). Intervals in the tree may overlap each other.
 */
export interface IntervalTreeNode {
    start: number;
    end: number;
}

/**
 * The interval tree can be queried using either a single point, or using an interval to define a
 * range of points. The query time is O(log n + k), with |k| being the number of results.
 */
type IntervalTreeQueryInput = { point: number } | { start: number; end: number; };

/**
 * Implementation of an immutable single-dimensional interval tree, as an augmented balanced binary
 * search tree. It provides functionality for finding all intervals containing either a given point,
 * or a given interval. The list of values given to the constructor does not rely on being sorted.
 *
 * @see https://en.wikipedia.org/wiki/Interval_tree
 */
export class IntervalTree<T extends IntervalTreeNode> {
    private values: T[];

    // Both the |tree| and |augmentations| hold indices to the |values| array.
    private augmentations: Uint32Array;
    private tree: Uint32Array;

    constructor(values: T[]) {
        this.values = values;

        // Height of the binary tree that's about to be created.
        const height = Math.ceil(Math.log2(values.length + 1));

        this.augmentations = new Uint32Array(values.length);
        this.tree = new Uint32Array(Math.pow(2, height));

        const sortedIndices = [ ...Array(values.length).keys() ].sort((lhs, rhs) => {
            if (values[lhs].start === values[rhs].start)
                return 0;

            return values[lhs].start > values[rhs].start ? 1 : -1;
        });

        this.buildBinarySearchTree(
            sortedIndices, /* index= */ 0, /* low= */ 0, /* high= */ values.length - 1);
    }

    /**
     * Builds the binary search tree based on the given (sorted) |indices|. This method will be
     * called recursively to establish the different branches of the tree. Returns the augmentation,
     * to be used when determining the higher-level augmentation.
     */
    private buildBinarySearchTree(indices: number[], i: number, low: number, high: number): number {
        const mid = (low + (high - low) / 2) | 0;
        const current = indices[mid];

        this.tree[i] = current + 1;

        // Determine whether this node needs left- or right branches. Generally this will be the
        // case as we're building a balanced tree, with the exceptions of the final leaf nodes.

        const left = i * 2 + 1;
        const leftEnd = low < mid ? this.buildBinarySearchTree(indices, left, low, mid - 1)
                                  : -Infinity;

        const right = i * 2 + 2;
        const rightEnd = high > mid ? this.buildBinarySearchTree(indices, right, mid + 1, high)
                                    : -Infinity;

        // The augmentation of the |current| node in the tree is equal to the highest value of
        // either the current node, or any of the branches built as part of this tree.
        const augmentation = Math.max(this.values[current].end, leftEnd, rightEnd);
        switch (augmentation) {
            case leftEnd:
                this.augmentations[current] = this.augmentations[this.tree[left] - 1];
                break;
            case rightEnd:
                this.augmentations[current] = this.augmentations[this.tree[right] - 1];
                break;
            default:
                this.augmentations[current] = current;
                break;
        }

        return augmentation;
    }

    /**
     * Queries the interval tree for the given |query|. This method handles queries for individual
     * points, as well as queries for intervals. Time complexity is O(log n + k) in either case.
     *
     * @param query Input for the query, either an individual point or an interval.
     * @return An array of the matching nodes stored in the tree.
     */
    query(query: IntervalTreeQueryInput): T[] {
        const isIntervalQuery = 'start' in query;

        const queryStart = isIntervalQuery ? query.start : query.point;
        const queryEnd = isIntervalQuery ? query.end : query.point + /* inclusive */ 1;

        const matches: T[] = [];

        const stack: number[] = [ /* root= */ 0 ];
        while (stack.length) {
            const index = stack.pop()!;

            const valueIndex = this.tree[index] - 1;
            const value = this.values[valueIndex];

            // Bail out if the query's lower bound exceeds the value on the right-hand traversal.
            const maxInterval = this.values[this.augmentations[valueIndex]];
            if (maxInterval === undefined)
                console.log(index, typeof this.tree[index], valueIndex, value, this.augmentations[valueIndex]);

            if (maxInterval.end <= queryStart)
                continue;

            const left = index * 2 + 1;
            if (left < this.tree.length && this.tree[left] !== 0)
                stack.push(left);

            const { start, end } = value;

            // Apply exclusive matching with logic depending on whether this is a point or an
            // interval query. Intervals that match will be added to |matches|.
            if ((isIntervalQuery && queryEnd > start && queryStart < end) ||
                    (!isIntervalQuery && queryStart >= start && queryEnd < end)) {
                matches.push(value);
            }

            // Bail out if the current node's lower bound exceeds the query's upper bound, as that
            // guarantees that no further nodes on right-hand traversal are relevant.
            if (start >= queryEnd)
                continue;

            const right = index * 2 + 2;
            if (right < this.tree.length && this.tree[right] !== 0)
                stack.push(right);
        }

        return matches;
    }
}
