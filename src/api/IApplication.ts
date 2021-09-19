// Copyright 2021 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

/**
 * @see https://github.com/AnimeNL/volunteer-portal/blob/main/API.md#request-iapplicationrequest
 */
 export interface IApplicationRequest {
    // Personal information:
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    emailAddress: string;
    phoneNumber: string;
    gender: string;
    shirtSize: string;

    // Participative information:
    preferences: string;

    available: boolean;
    hotel: boolean;
    whatsApp: boolean;

    // Requirements:
    covidRequirements: boolean;
    gdprRequirements: boolean;
}

/**
 * @see https://github.com/AnimeNL/volunteer-portal/blob/main/API.md#response-iapplicationresponse
 */
export interface IApplicationResponse {
    // Iff the application was successful:
    accessCode?: string;

    // Iff the application was not successful:
    error?: string;
}
