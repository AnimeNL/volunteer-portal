// Copyright 2021 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

import { ConfigurationImpl } from './ConfigurationImpl';

describe('ConfigurationImpl', () => {
    it('has the ability to override configuration based on the environment', () => {
        const defaultConfiguration = new ConfigurationImpl();
        const hostname = 'https://example.com';

        process.env.REACT_APP_API_HOST = hostname;
        const environmentConfiguration = new ConfigurationImpl();

        expect(defaultConfiguration.getEnvironmentEndpoint()).not.toContain(hostname);
        expect(environmentConfiguration.getEnvironmentEndpoint()).toContain(hostname);

        expect(environmentConfiguration.getEnvironmentEndpoint()).not.toEqual(
            defaultConfiguration.getEnvironmentEndpoint());
    });

    it('has the ability to safely append request parameters', () => {
        if (process.env.hasOwnProperty('REACT_APP_API_HOST'))
            delete process.env.REACT_APP_API_HOST;

        const configuration = new ConfigurationImpl();

        expect(configuration.getUserEndpoint('bar')).toEqual('/api/user?authToken=bar');
        expect(configuration.getUserEndpoint('%& :D')).toEqual('/api/user?authToken=%25%26+%3AD');

        const kEventExpectations: [ [ string, string ], string ][] = [
            [ [ 'bar', 'baz' ], '/api/event?authToken=bar&event=baz' ],
            [ [ '%& :D', 'baz' ], '/api/event?authToken=%25%26+%3AD&event=baz' ],
            [ [ 'bar', '%& :D' ], '/api/event?authToken=bar&event=%25%26+%3AD' ]
        ];

        for (const [ parameters, expected ] of kEventExpectations)
            expect(configuration.getEventEndpoint(...parameters)).toEqual(expected);
    });
});
