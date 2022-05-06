// Copyright 2022 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

import mockFetch from 'jest-fetch-mock';

import { UserImpl } from './UserImpl';
import { uploadNotes } from './Notes';

describe('Notes', () => {
    beforeEach(() => {
        mockFetch.mockOnceIf('/api/auth', async request => ({
            body: JSON.stringify({ authToken: 'my-token' }),
            status: 200,
        }));

        mockFetch.mockOnceIf('/api/user?authToken=my-token', async request => ({
            body: JSON.stringify({
                administrator: false,
                events: { '2022-regular': 'Volunteer' },
                name: 'Volunteer Joe',
            }),
            status: 200,
        }));
    });

    it('should be able to issue a valid API request to the server', async () => {
        const user = new UserImpl();

        expect(await user.authenticate({
            emailAddress: 'foo@example.com',
            accessCode: '1234'
        })).toBeTruthy();

        expect(user.authenticated).toBeTruthy();

        mockFetch.mockOnceIf('/api/notes?authToken=my-token', async request => ({
            body: JSON.stringify({ notes: await request.text() }),
            status: 200,
        }));

        const notes = await uploadNotes(user, 'event', 'my-event-id', 'hello, world!');

        // No, this isn't what's being uploaded. This is a change detector test to identify when we
        // can actually test this, depending on NodeJS implementing and supporting FormData.
        expect(notes).toEqual('[object FormData]');
    });

    it('should be able to throw an exception on server failure', async () => {
        const user = new UserImpl();

        expect(await user.authenticate({
            emailAddress: 'foo@example.com',
            accessCode: '1234'
        })).toBeTruthy();

        expect(user.authenticated).toBeTruthy();

        mockFetch.mockOnceIf('/api/notes?authToken=my-token', async request => ({
            status: 404,
        }));

        let thrown = false;
        try {
            const notes = await uploadNotes(user, 'event', 'my-event-id', 'hello, world!');
        } catch (error) {
            thrown = true;
        }

        expect(thrown).toBeTruthy();
    });
});
