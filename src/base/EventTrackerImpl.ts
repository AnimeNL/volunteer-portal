// Copyright 2022 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

import type { EventInfo, EventShift, EventVolunteer } from './Event';
import type { EventTracker } from './EventTracker';

import { DateTime } from './DateTime';
import { Event } from './Event';

// Maximum value of int32-1, which gives us a timestamp far into 2038.
const kMaximumNextUpdateUnixTime = 2147483646;

// The Event Tracker is a layer on top of the Event which keeps track of the active and upcoming
// events. It supports a convenient API for quick querying.
export class EventTrackerImpl implements EventTracker {
    #event: Event;

    #activeVolunteers: Map<EventVolunteer, EventInfo | null> = new Map();
    #activeVolunteerCount = 0;

    #upcomingVolunteerShift: Map<EventVolunteer, EventShift> = new Map();

    #nextUpdate: DateTime | undefined;

    constructor(event: Event) {
        this.#event = event;
    }

    // ---------------------------------------------------------------------------------------------
    // Mutation API
    // ---------------------------------------------------------------------------------------------

    update(dateTime: DateTime): void {
        this.#activeVolunteers = new Map();
        this.#activeVolunteerCount = 0;

        this.#upcomingVolunteerShift = new Map();

        this.#nextUpdate = DateTime.fromUnix(kMaximumNextUpdateUnixTime);

        // (1) Iterate through the events and their sessions.
        for (const event of this.#event.events()) {
            for (const session of event.sessions) {
                if (dateTime.isBefore(session.startTime)) {
                    if (session.startTime.isBefore(this.#nextUpdate))
                        this.#nextUpdate = session.startTime;

                    // Continue iterating through all events; hypothetically an |event| can have
                    // multiple timeslots that happen simultaneously.
                    continue;
                }

                if (session.endTime.isSameOrBefore(dateTime))
                    continue;  // the |session| has finished already

                // TODO: Store the |session| somewhere.

                if (session.endTime.isBefore(this.#nextUpdate))
                    this.#nextUpdate = session.endTime;
            }
        }

        // (2) Iterate through the volunteers and their shifts.
        for (const volunteer of this.#event.volunteers()) {
            for (const shift of volunteer.shifts) {
                if (dateTime.isBefore(shift.startTime)) {
                    if (shift.startTime.isBefore(this.#nextUpdate))
                        this.#nextUpdate = shift.startTime;

                    // Stop iterating through the shifts once we've identified their active and
                    // upcoming shift; each volunteer is expected to have a linear schedule, as they
                    // cannot be in two places at once. Right?
                    if (shift.type === 'shift') {
                        this.#upcomingVolunteerShift.set(volunteer, shift);
                        break;
                    }

                    continue;
                }

                if (shift.endTime.isSameOrBefore(dateTime))
                    continue;  // the |shift| has finished already

                switch (shift.type) {
                    case 'unavailable':
                        break;

                    case 'available':
                        this.#activeVolunteers.set(volunteer, /* available= */ null);
                        break;

                    case 'shift':
                        this.#activeVolunteers.set(volunteer, shift.event!);
                        this.#activeVolunteerCount++;
                        break;
                }

                if (shift.endTime.isBefore(this.#nextUpdate))
                    this.#nextUpdate = shift.endTime;
            }
        }

        // (3) Clear out the |#nextUpdate| if it's still set in 2038.
        if (this.#nextUpdate.unix() === kMaximumNextUpdateUnixTime)
            this.#nextUpdate = undefined;
    }

    // ---------------------------------------------------------------------------------------------
    // Query API
    // ---------------------------------------------------------------------------------------------

    getNextUpdateDateTime(): DateTime | undefined {
        return this.#nextUpdate;
    }

    getActiveVolunteerCount(): number {
        return this.#activeVolunteerCount;
    }

    getVolunteerActivity(volunteer: EventVolunteer): EventInfo | 'available' | 'unavailable' {
        const volunteerState = this.#activeVolunteers.get(volunteer);
        if (volunteerState === undefined)
            return 'unavailable';

        if (volunteerState === null)
            return 'available';

        return volunteerState;
    }

    getVolunteerUpcomingShift(volunteer: EventVolunteer): EventShift | undefined {
        return this.#upcomingVolunteerShift.get(volunteer);
    }
}
