// Copyright 2022 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

import type { EventArea, EventInfo, EventSession, EventShift, EventVolunteer } from './Event';
import type { EventTracker } from './EventTracker';
import type { User } from './User';

import { DateTime } from './DateTime';
import { Event } from './Event';

// Maximum value of int32-1, which gives us a timestamp far into 2038.
const kMaximumNextUpdateUnixTime = 2147483646;

// The Event Tracker is a layer on top of the Event which keeps track of the active and upcoming
// events. It supports a convenient API for quick querying.
export class EventTrackerImpl implements EventTracker {
    #event: Event;

    #user: User | undefined;
    #userVolunteer: EventVolunteer | undefined;

    #activeSessions: EventSession[] = [];
    #activeSessionsByArea: Map<EventArea, number> = new Map();
    #activeVolunteers: Map<EventVolunteer, EventShift | null> = new Map();
    #activeVolunteerCount = 0;
    #availableSeniors: EventVolunteer[] = [];

    #upcomingVolunteerActivity: Map<EventVolunteer, EventShift> = new Map();
    #upcomingVolunteerShift: Map<EventVolunteer, EventShift> = new Map();

    #nextSession: EventSession | undefined;
    #nextUpdate: DateTime | undefined;

    constructor(event: Event, user?: User) {
        this.#event = event;
        this.#user = user;
    }

    // ---------------------------------------------------------------------------------------------
    // Mutation API
    // ---------------------------------------------------------------------------------------------

    update(dateTime: DateTime): void {
        this.#userVolunteer = undefined;

        this.#activeSessions = [];
        this.#activeSessionsByArea = new Map();
        this.#activeVolunteers = new Map();
        this.#activeVolunteerCount = 0;
        this.#availableSeniors = [];

        this.#upcomingVolunteerActivity = new Map();
        this.#upcomingVolunteerShift = new Map();

        this.#nextSession = undefined;
        this.#nextUpdate = DateTime.fromUnix(kMaximumNextUpdateUnixTime);

        // (1) Iterate through the events and their sessions.
        for (const event of this.#event.events()) {
            for (const session of event.sessions) {
                if (dateTime.isBefore(session.startTime)) {
                    if (session.startTime.isSameOrBefore(this.#nextUpdate)) {
                        this.#nextSession = session;
                        this.#nextUpdate = session.startTime;
                    }

                    // Continue iterating through all events; hypothetically an |event| can have
                    // multiple timeslots that happen simultaneously.
                    continue;
                }

                if (session.endTime.isSameOrBefore(dateTime))
                    continue;  // the |session| has finished already

                this.#activeSessions.push(session);
                this.#activeSessionsByArea.set(
                    session.location.area,
                    1 + (this.#activeSessionsByArea.get(session.location.area) || 0));

                if (session.endTime.isBefore(this.#nextUpdate))
                    this.#nextUpdate = session.endTime;
            }
        }

        // (2) Iterate through the volunteers and their shifts.
        for (const volunteer of this.#event.volunteers()) {
            if (this.#user && this.#user.name === volunteer.name)
                this.#userVolunteer = volunteer;

            for (const shift of volunteer.shifts) {
                if (dateTime.isBefore(shift.startTime)) {
                    if (shift.startTime.isBefore(this.#nextUpdate))
                        this.#nextUpdate = shift.startTime;

                    // Store the volunteer's upcoming activity. This can be a shift, but also time
                    // during which they're explicitly marked as being available.
                    if (!this.#upcomingVolunteerActivity.has(volunteer))
                        this.#upcomingVolunteerActivity.set(volunteer, shift);

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
                        this.#activeVolunteers.set(volunteer, /* shift= */ null);
                        for (const role of Object.values(volunteer.environments)) {
                            if (role.indexOf('enior') === -1 && role.indexOf('taff') === -1)
                                continue;  // the |volunteer| isn't a Senior or Staff volunteer

                            this.#availableSeniors.push(volunteer);
                            break;
                        }

                        break;

                    case 'shift':
                        this.#activeVolunteers.set(volunteer, shift);
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

    getActiveSessionCount(): number {
        return this.#activeSessions.length;
    }

    getActiveSessionCountForArea(area: EventArea): number {
        return this.#activeSessionsByArea.get(area) || 0;
    }

    getActiveSessions(): EventSession[] {
        return this.#activeSessions;
    }

    getActiveVolunteerCount(): number {
        return this.#activeVolunteerCount;
    }

    getAvailableSeniors(): EventVolunteer[] {
        return this.#availableSeniors;
    }

    getUpcomingSession() : EventSession | undefined {
        return this.#nextSession;
    }

    getUserVolunteer(): EventVolunteer | undefined {
        return this.#userVolunteer;
    }

    getVolunteerActivity(volunteer: EventVolunteer): EventShift | 'available' | 'unavailable' {
        const volunteerState = this.#activeVolunteers.get(volunteer);
        if (volunteerState === undefined)
            return 'unavailable';

        if (volunteerState === null)
            return 'available';

        return volunteerState;
    }

    getVolunteerUpcomingActivity(volunteer: EventVolunteer): EventShift | undefined {
        return this.#upcomingVolunteerActivity.get(volunteer);
    }

    getVolunteerUpcomingShift(volunteer: EventVolunteer): EventShift | undefined {
        return this.#upcomingVolunteerShift.get(volunteer);
    }
}
