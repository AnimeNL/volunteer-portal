// Copyright 2021 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

import moment from 'moment-timezone';

import { EventImpl } from './EventImpl';

describe('EventImpl', () => {
    /**
     * Default timezone for these tests, to avoid different results for different people.
     */
    moment.tz.setDefault('Europe/London');

    /**
     * Fixed event identifier that will be used throughout the tests.
     */
    const kEventIdentifier = '2021-event';

    it('provides the ability to access location information', async () => {
        const event = new EventImpl(kEventIdentifier, {
            events: [],
            locations: [
                {
                    name: 'Round Tower',
                    area: 'Towers',
                },
                {
                    name: 'Square Pyramid',
                    area: 'Pyramids',
                },
                {
                    name: 'Square Tower',
                    area: 'Towers',
                }
            ],
            volunteers: [],
        });

        expect(event.identifier).toEqual(kEventIdentifier);

        const areas = [];
        for (const area of event.getAreas())
            areas.push(area);

        expect(areas.sort()).toStrictEqual([ 'Pyramids', 'Towers' ]);

        {
            const tower = event.getLocation('Round Tower');
            expect(tower).not.toBeUndefined();

            expect(tower?.area).toEqual('Towers');
            expect(tower?.name).toEqual('Round Tower');
        }

        expect(event.getLocation('Circular Factory')).toBeUndefined();

        const locations = [];
        for (const location of event.getLocations())
            locations.push(location.name);

        expect(locations.sort()).toStrictEqual([ 'Round Tower', 'Square Pyramid', 'Square Tower' ]);

        const areaLocations = [];
        for (const location of event.getLocationsForArea('Towers'))
            areaLocations.push(location.name);

        expect(areaLocations.sort()).toStrictEqual([ 'Round Tower', 'Square Tower' ]);

        const unknownAreaLocations = [];
        for (const location of event.getLocationsForArea('Factories'))
            unknownAreaLocations.push(location.name);

        expect(unknownAreaLocations).toStrictEqual([ /* empty */ ]);
    });

    it('provides the ability to access event information through locations', async () => {
        const event = new EventImpl(kEventIdentifier, {
            events: [
                {
                    title: 'Circular Dance',
                    description: 'Dancing in a circle in the round tower',
                    sessions: [
                        {
                            location: 'Round Tower',
                            time: [ 1617577200, 1617663599 ],  // note: this session is out-of-order
                        },
                        {
                            location: 'Round Tower',
                            time: [ 1617490800, 1617577199 ],
                        }
                    ],
                }
            ],
            locations: [
                {
                    name: 'Round Tower',
                    area: 'Towers',
                },
            ],
            volunteers: [],
        });

        const tower = event.getLocation('Round Tower')!;
        expect(tower).not.toBeUndefined();

        expect(tower.sessions.length).toEqual(2);
        {
            expect(tower.sessions[0].event.title).toEqual('Circular Dance');
            expect(tower.sessions[0].location).toStrictEqual(tower);

            expect(`${tower.sessions[0].startTime}`).toEqual('Sun Apr 04 2021 00:00:00 GMT+0100');
            expect(`${tower.sessions[0].endTime}`).toEqual('Sun Apr 04 2021 23:59:59 GMT+0100');

            expect(tower.sessions[0].event.sessions.length).toEqual(2);
        }
        {
            expect(tower.sessions[1].event.title).toEqual('Circular Dance');
            expect(tower.sessions[1].location).toStrictEqual(tower);

            expect(`${tower.sessions[1].startTime}`).toEqual('Mon Apr 05 2021 00:00:00 GMT+0100');
            expect(`${tower.sessions[1].endTime}`).toEqual('Mon Apr 05 2021 23:59:59 GMT+0100');

            expect(tower.sessions[1].event.sessions.length).toEqual(2);
        }

        expect(tower.sessions[0].event).toStrictEqual(tower.sessions[1].event);
        expect(tower.sessions[0].location).toStrictEqual(tower.sessions[1].location);
    });

    it('provides the ability to access sessions active at a given time', async () => {
        const event = new EventImpl(kEventIdentifier, {
            events: [
                {
                    title: 'Circular Dance',
                    description: 'Dancing in a circle in the round tower',
                    sessions: [
                        {
                            location: 'Round Tower',
                            time: [ 1617490800, 1617577199 ],
                        },
                    ],
                },
                {
                    title: 'Triangular Dance',
                    description: 'Dancing in a triangle in the round tower',
                    sessions: [
                        {
                            location: 'Round Tower',
                            time: [ 1617573600, 1617663599 ],
                        }
                    ],
                }
            ],
            locations: [
                {
                    name: 'Round Tower',
                    area: 'Towers',
                },
            ],
            volunteers: [],
        });

        // (1) Before the sessions.
        expect(event.getActiveSessions(moment('2021-04-03T23:59:59')).length).toEqual(0);

        // (2) During the first session (Circular Dance).
        {
            const sessions = event.getActiveSessions(moment('2021-04-04T01:00:00'));

            expect(sessions.length).toEqual(1);
            expect(sessions[0].event.title).toEqual('Circular Dance');
        }

        // (3) During the overlap between the sessions.
        {
            const sessions = event.getActiveSessions(moment('2021-04-04T23:30:00'));

            expect(sessions.length).toEqual(2);
            expect(sessions[0].event.title).toEqual('Circular Dance');
            expect(sessions[1].event.title).toEqual('Triangular Dance');
        }

        // (4) During the second session (Triangular Dance).
        {
            const sessions = event.getActiveSessions(moment('2021-04-05T23:00:00'));

            expect(sessions.length).toEqual(1);
            expect(sessions[0].event.title).toEqual('Triangular Dance');
        }

        // (5) After the sessions.
        expect(event.getActiveSessions(moment('2021-04-06T00:00:00')).length).toEqual(0);
    });

    it('provides the ability to access volunteer information', async () => {
        const event = new EventImpl(kEventIdentifier, {
            events: [],
            locations: [],
            volunteers: [
                {
                    name: [ 'John', 'Doe' ],
                    identifier: 'john-doe',
                    avatar: '/john-doe.jpg',
                },
                {
                    name: [ 'Jane', '' ],
                    identifier: 'jane',
                }
            ],
        });

        expect(event.identifier).toEqual(kEventIdentifier);

        {
            const volunteerJohn = event.getVolunteer('john-doe');
            expect(volunteerJohn).not.toBeUndefined();

            expect(volunteerJohn?.name).toEqual('John Doe');
            expect(volunteerJohn?.firstName).toEqual('John');
            expect(volunteerJohn?.lastName).toEqual('Doe');
            expect(volunteerJohn?.identifier).toEqual('john-doe');
            expect(volunteerJohn?.avatar).toEqual('/john-doe.jpg');
        }

        {
            const volunteerJane = event.getVolunteer('jane');
            expect(volunteerJane).not.toBeUndefined();

            expect(volunteerJane?.name).toEqual('Jane');
            expect(volunteerJane?.firstName).toEqual('Jane');
            expect(volunteerJane?.lastName).toEqual('');
            expect(volunteerJane?.identifier).toEqual('jane');
            expect(volunteerJane?.avatar).toBeUndefined();
        }

        expect(event.getVolunteer('frank')).toBeUndefined();

        let identifiers = [];
        for (const volunteer of event.getVolunteers())
            identifiers.push(volunteer.firstName);

        expect(identifiers.sort()).toStrictEqual(['Jane', 'John']);
    });
});
