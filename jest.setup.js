// Copyright 2021 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

const mockFetch = require('jest-fetch-mock');

// Enables the fetch() function to be used in scripts. Default responses are provided for each of
// the key API calls to enable tests to access these in functions.
mockFetch.enableMocks();

mockFetch.mockIf(/\/api\/environment$/, async request => JSON.stringify({
    eventName: 'Example event',
    portalTitle: 'Volunteer Portal',
    seniorTitle: 'Senior Volunteer',
    timezone: 'Europe/London',
    year: 2021,
}));
