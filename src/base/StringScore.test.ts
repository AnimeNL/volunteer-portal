/**
 * This implementation is based on the following two GitHub repositories, both MIT licensed. The
 * code is copied as Josh' repository alters the String prototype, which we should avoid, whereas
 * Kenneth's repository doesn't have TypeScript definitions available.
 *
 * The code is used effectively as available in Kenneth's repository, with a few minor consistency
 * improvements aligned with the rest of the code in our repository.
 *
 * https://github.com/knpwrs/string-score (Kenneth Powers, kenpowers.net)
 * https://github.com/joshaven/string_score (Joshaven Potter, joshaven.com)
 */

import { StringScore } from './StringScore';

describe('StringScore', () => {
    const hello = 'Hello, World!';

    it('should return 1.0 when passed two equal strings', () => {
        expect(StringScore('Foo', 'Foo')).toEqual(1.0);
    });

    it('should return 0.0 when passed strings with non-existing characters', () => {
        expect(StringScore('Foo Bar', 'fuu')).toEqual(0.0);
        expect(StringScore('Foo Bar', 'Foo_Bar')).toEqual(0.0);
    });

    it('should return 0.0 when passed an empty query', () => {
        expect(StringScore('Foo Bar', '')).toEqual(0.0);
    });

    it('should only match sequentially', () => {
        expect(StringScore(hello, 'WH')).toEqual(0.0);
    });

    it('should return a better score for the same case rather than the opposite case', () => {
        expect(StringScore(hello, 'hello')).toBeLessThan(StringScore(hello, 'Hello'));
    });

    it('should return a higher score for closer matches', () => {
        expect(StringScore(hello, 'H')).toBeLessThan(StringScore(hello, 'He'));
    });

    it('should return a match with the wrong case', () => {
        expect(StringScore('Hillsdale, Michigan', 'himi')).toBeGreaterThan(0.0);
    });

    it('should have proper relative weighting', () => {
        const str = hello;

        expect(StringScore(str, 'e')).toBeLessThan(StringScore(str, 'h'));
        expect(StringScore(str, 'h')).toBeLessThan(StringScore(str, 'he'));
        expect(StringScore(str, 'hel')).toBeLessThan(StringScore(str, 'hell'));
        expect(StringScore(str, 'hell')).toBeLessThan(StringScore(str, 'hello'));
        expect(StringScore(str, 'hello')).toBeLessThan(StringScore(str, 'helloworld'));
        expect(StringScore(str, 'hello worl')).toBeLessThan(StringScore(str, 'helloworl'));
        expect(StringScore(str, 'hello worl')).toBeLessThan(StringScore(str, 'hello world'));
    });

    it('has a consecutive letter bonus', () => {
        expect(StringScore(hello, 'Hel')).toBeGreaterThan(StringScore(hello, 'Hld'));
    });

    it('has an acronym bonus', () => {
        expect(StringScore(hello, 'HW', 0.5)).toBeGreaterThan(StringScore(hello, 'Ho', 0.5));
        expect(StringScore('Hillsdale Michigan', 'HiMi', 0.5))
            .toBeGreaterThan(StringScore('Hillsdale, Michigan', 'Hil', 0.5));
        expect(StringScore('Hillsdale Michigan', 'HiMi', 0.5))
            .toBeGreaterThan(StringScore('Hillsdale, Michigan', 'illsda', 0.5));
        expect(StringScore('Hillsdale Michigan', 'HiMi', 0.5))
            .toBeGreaterThan(StringScore('Hillsdale, Michigan', 'Hills', 0.5));
        expect(StringScore('Hillsdale Michigan', 'HiMi', 0.5))
            .toBeGreaterThan(StringScore('Hillsdale, Michigan', 'hillsd', 0.5));
    });

    it('has a beginning of string bonus', () => {
        expect(StringScore('Hillsdale', 'hi')).toBeGreaterThan(StringScore('Hillsdale', 'dale'));
        expect(StringScore(hello, 'h')).toBeGreaterThan(StringScore(hello, 'w'));
    });

    it('has proper string weights', () => {
        expect(StringScore('Research Resources North', 'res'))
            .toBeGreaterThan(StringScore('Mary Conces', 'res'));
        expect(StringScore('Research Resources North', 'res'))
            .toBeGreaterThan(StringScore('Mary had a resourceful little lamb.', 'res'));
    });

    it('should score mismatched strings', () => {
        expect(StringScore(hello, 'Hz')).toEqual(0);
        expect(StringScore(hello, 'Hz', 0.5)).toBeGreaterThan(0);
        expect(StringScore(hello, 'Hz', 0.5)).toBeLessThan(StringScore(hello, 'He', 0.5));
    });

    it('should be tuned well', () => {
        expect(StringScore(hello, 'Hello, Worl', 0.5))
            .toBeGreaterThan(StringScore(hello, 'Hello, Worl1'));
        expect(StringScore(hello, 'jello', 0.5)).toBeGreaterThan(0);
    });

    it('should have varying degrees of fuzziness', () => {
        expect(StringScore(hello, 'Hz', 0.9)).toBeGreaterThan(StringScore(hello, '0.5'));
    });
});
