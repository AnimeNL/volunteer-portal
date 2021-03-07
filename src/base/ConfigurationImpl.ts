// Copyright 2021 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

import { Configuration } from './Configuration';

/**
 * Implementation of the Configuration interface. Comes with a number of setters usable by the
 * test runner to change behaviour. These should not be used in a production environment.
 */
export class ConfigurationImpl implements Configuration {
    /**
     * The portal will, by default, use the hostname included in the HTTP request. This can be
     * overridden by setting the `REACT_APP_API_HOST` environmental variable at build time.
     */
    private hostname: string;

    constructor() {
        this.hostname = process.env.REACT_APP_API_HOST || '';
    }

    getAuthenticationEndpoint(): string {
        return this.hostname + '/api/auth';
    }

    getContentEndpoint(): string {
        return this.hostname + '/api/content';
    }

    getEnvironmentEndpoint(): string {
        return this.hostname + '/api/environment';
    }

    getUserEndpoint(authToken: string): string {
        return `${this.hostname}/api/user?${new URLSearchParams({ authToken })}`;
    }
}
