// Copyright 2017 Peter Beverloo. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import {App} from '../app';
import {inject} from 'aurelia-framework';

@inject(App)
export class Volunteers {
    constructor(application) {
        this.application_ = application;
    }

    activate(params, config, instruction) {
        this.application_.title = 'Volunteers';
    }

    get volunteers() {
        return this.application_.convention.volunteers;
    }
}
