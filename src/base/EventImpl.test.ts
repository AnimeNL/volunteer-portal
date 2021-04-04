// Copyright 2021 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

import { EventImpl } from './EventImpl';

describe('EventImpl', () => {
    /**
     * Fixed event identifier that will be used throughout the tests.
     */
    const kEventIdentifier = '2021-event';

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
