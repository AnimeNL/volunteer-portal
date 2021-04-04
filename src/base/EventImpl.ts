// Copyright 2021 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

import { Event } from './Event';
import { IEventResponse } from '../api/IEvent';

/**
 * Implementation of the Event interface. Instances should only be created through the EventFactory,
 * unless tests are being ran which specifically verify behaviour of this class' functionality.
 */
export class EventImpl implements Event {
    #identifier: string;

    constructor(identifier: string, event: IEventResponse) {
        this.#identifier = identifier;
    }

    get identifier() { return this.#identifier; }
}
