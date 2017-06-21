// Copyright 2017 Peter Beverloo. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

export default class Convention {
    constructor(name) {
        this.name = 'Anime 2018';
        this.volunteers = [
            'Ferdi',
            'Patrick',
            'Peter'
        ];
    }

    load() {
        return Promise.resolve();
    }
}
