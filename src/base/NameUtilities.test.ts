// Copyright 2021 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

import { firstName, initial, initials } from './NameUtilities';

describe('NameUtilities', () => {
    it('should be able to distinguish a first name', () => {
        expect(firstName('Foo Bar')).toStrictEqual('Foo');
        expect(firstName('Foo Bar Baz')).toStrictEqual('Foo');
        expect(firstName('Foo ')).toStrictEqual('Foo');
        expect(firstName('Foo')).toStrictEqual('Foo');
        expect(firstName('foo')).toStrictEqual('foo');
        expect(firstName(' Foo')).toStrictEqual('Foo');
        expect(firstName(' Foo Bar')).toStrictEqual('Foo');

        /// @ts-ignore
        expect(initial(/* fullName= */ undefined)).toStrictEqual('');
    });

    it('should be able to provide the initial of a name', () => {
        expect(initial('Foo Bar')).toStrictEqual('F');
        expect(initial('Foo')).toStrictEqual('F');
        expect(initial('foo Bar')).toStrictEqual('F');
        expect(initial('foo')).toStrictEqual('F');

        /// @ts-ignore
        expect(initial(/* fullName= */ undefined)).toStrictEqual('');
    });

    it('should be able to provide the initials (plural) of a name', () => {
        expect(initials('Foo Bar')).toStrictEqual('FB');
        expect(initials('Foo Bar Baz')).toStrictEqual('FB');
        expect(initials('Foo ')).toStrictEqual('F');
        expect(initials('Foo')).toStrictEqual('F');
        expect(initials('foo')).toStrictEqual('F');
        expect(initials(' Foo')).toStrictEqual('F');
        expect(initials(' Foo Bar')).toStrictEqual('FB');
    });
});
