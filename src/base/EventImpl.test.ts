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
            areas: [
                {
                    identifier: 'Towers',
                    name: 'The Towers',
                },
                {
                    identifier: 'Pyramids',
                    name: 'The Pyramids',
                }
            ],
            events: [],
            locations: [
                {
                    identifier: 'round-tower',
                    name: 'Round Tower',
                    area: 'Towers',
                },
                {
                    identifier: 'square-pyramid',
                    name: 'Square Pyramid',
                    area: 'Pyramids',
                },
                {
                    identifier: 'square-tower',
                    name: 'Square Tower',
                    area: 'Towers',
                }
            ],
            meta: {
                name: 'My Event',
                timezone: 'Europe/Amsterdam',
            },
            volunteers: [],
        });

        expect(event.identifier).toEqual(kEventIdentifier);

        const areas = [];
        for (const area of event.getAreas())
            areas.push(area.name);

        expect(areas.sort()).toStrictEqual([ 'The Pyramids', 'The Towers' ]);

        {
            const tower = event.getLocation('round-tower');
            expect(tower).not.toBeUndefined();

            expect(tower?.area.name).toEqual('The Towers');
            expect(tower?.name).toEqual('Round Tower');
        }

        expect(event.getLocation('Circular Factory')).toBeUndefined();

        const locations = [];
        for (const location of event.getLocations())
            locations.push(location.name);

        expect(locations.sort()).toStrictEqual([ 'Round Tower', 'Square Pyramid', 'Square Tower' ]);
    });

    it('provides the ability to access event information through locations', async () => {
        const event = new EventImpl(kEventIdentifier, {
            areas: [
                {
                    identifier: 'Towers',
                    name: 'The Towers',
                }
            ],
            events: [
                {
                    hidden: false,
                    identifier: '12345',
                    sessions: [
                        {
                            location: 'round-tower',
                            name: 'Circular Dance',
                            time: [ 1617577200, 1617663599 ],  // note: this session is out-of-order
                        },
                        {
                            location: 'round-tower',
                            name: 'Circular Dance',
                            time: [ 1617490800, 1617577199 ],
                        }
                    ],
                }
            ],
            locations: [
                {
                    identifier: 'round-tower',
                    name: 'Round Tower',
                    area: 'Towers',
                },
            ],
            meta: {
                name: 'My Event',
                timezone: 'Europe/Amsterdam',
            },
            volunteers: [],
        });

        const tower = event.getLocation('round-tower')!;
        expect(tower).not.toBeUndefined();

        expect(tower.sessions.length).toEqual(2);
        {
            expect(tower.sessions[0].event.hidden).toBeFalsy();
            expect(tower.sessions[0].location).toStrictEqual(tower);

            expect(`${tower.sessions[0].startTime}`).toEqual('Sun Apr 04 2021 00:00:00 GMT+0100');
            expect(`${tower.sessions[0].endTime}`).toEqual('Sun Apr 04 2021 23:59:59 GMT+0100');

            expect(tower.sessions[0].event.sessions.length).toEqual(2);
        }
        {
            expect(tower.sessions[1].event.hidden).toBeFalsy();
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
            areas: [
                {
                    identifier: 'Towers',
                    name: 'The Towers',
                }
            ],
            events: [
                {
                    hidden: true,
                    identifier: '12345',
                    sessions: [
                        {
                            name: 'Circular Dance',
                            location: 'round-tower',
                            time: [ 1617490800, 1617577199 ],
                        },
                    ],
                },
                {
                    hidden: false,
                    identifier: '34567',
                    sessions: [
                        {
                            name: 'Triangular Dance',
                            location: 'round-tower',
                            time: [ 1617573600, 1617663599 ],
                        }
                    ],
                }
            ],
            locations: [
                {
                    identifier: 'round-tower',

                    name: 'Round Tower',
                    area: 'Towers',
                },
            ],
            meta: {
                name: 'My Event',
                timezone: 'Europe/Amsterdam',
            },
            volunteers: [],
        });

        // (1) Before the sessions.
        expect(event.getActiveSessions(moment('2021-04-03T23:59:59')).length).toEqual(0);

        // (2) During the first session (Circular Dance).
        {
            const sessions = event.getActiveSessions(moment('2021-04-04T01:00:00'));

            expect(sessions.length).toEqual(1);
            expect(sessions[0].name).toEqual('Circular Dance');
        }

        // (3) During the overlap between the sessions.
        {
            const sessions = event.getActiveSessions(moment('2021-04-04T23:30:00'));

            expect(sessions.length).toEqual(2);
            expect(sessions[0].name).toEqual('Circular Dance');
            expect(sessions[1].name).toEqual('Triangular Dance');
        }

        // (4) During the second session (Triangular Dance).
        {
            const sessions = event.getActiveSessions(moment('2021-04-05T23:00:00'));

            expect(sessions.length).toEqual(1);
            expect(sessions[0].name).toEqual('Triangular Dance');
        }

        // (5) After the sessions.
        expect(event.getActiveSessions(moment('2021-04-06T00:00:00')).length).toEqual(0);
    });

    it('provides the ability to access volunteer information', async () => {
        const event = new EventImpl(kEventIdentifier, {
            areas: [],
            events: [],
            locations: [],
            meta: {
                name: 'My Event',
                timezone: 'Europe/Amsterdam',
            },
            volunteers: [
                {
                    identifier: 'john-doe',
                    name: [ 'John', 'Doe' ],
                    environments: [ 'Volunteer Club' ],

                    avatar: '/john-doe.jpg',
                },
                {
                    identifier: 'jane',
                    name: [ 'Jane', '' ],
                    environments: [ 'Volunteer Club' ],
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
