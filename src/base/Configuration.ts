// Copyright 2021 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

/**
 * Interface definition for the application's static configuration. This is known at build time,
 * but can be influenced by the test runner or the production environment.
 */
export interface Configuration {
    /**
     * Returns a URL to the endpoint where the Application API can be used.
     * @see https://github.com/AnimeNL/volunteer-portal/blob/master/API.md#apiapplication
     */
    getApplicationEndpoint(): string;

    /**
     * Returns a URL to the endpoint where the Authentication API can be used.
     * @see https://github.com/AnimeNL/volunteer-portal/blob/master/API.md#apiauth
     */
    getAuthenticationEndpoint(): string;

    /**
     * Returns a URL to the endpoint where data of the Content API can be obtained.
     * @see https://github.com/AnimeNL/volunteer-portal/blob/master/API.md#apicontent
     */
    getContentEndpoint(): string;

    /**
     * Returns a URL to the endpoint where data of the Environment API can be obtained.
     * @see https://github.com/AnimeNL/volunteer-portal/blob/master/API.md#apienvironment
     */
    getEnvironmentEndpoint(): string;

    /**
     * Returns a URL to the endpoint where the Event API can be reached.
     * @see https://github.com/AnimeNL/volunteer-portal/blob/master/API.md#apievent
     */
    getEventEndpoint(authToken: string, event: string): string;

    /**
     * Returns a URL to the endpoint where the User API can be used.
     * @see https://github.com/AnimeNL/volunteer-portal/blob/master/API.md#apiuser
     */
    getUserEndpoint(authToken: string): string;
}
