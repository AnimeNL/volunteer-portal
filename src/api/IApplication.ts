// Copyright 2021 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

/**
 * The /api/application endpoint allows new volunteers to submit an application to join the team
 * in one of the future events. Signed in users will receive status updates on the progression of
 * their application, displayed in the registration portal.
 */
export interface IApplication {
    request: IApplicationRequest;
    response: IApplicationResponse;
}

/**
 * Request issued to the server when making an /api/user call. All information will be submitted to
 * the server as a HTTP POST request, with the exception of the `event` parameter.
 */
 export interface IApplicationRequest {
    // Identifier of the event for which an application is being made.
    event: string;

    // Personal information:
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    emailAddress: string;
    phoneNumber: string;
    gender: string;
    shirtSize: string;

    // Participative information:
    commitmentHours: string;
    commitmentTiming: string;
    preferences: string;

    available: boolean;
    credits: boolean;
    hotel: boolean;
    whatsApp: boolean;

    // Requirements:
    gdprRequirements: boolean;
}

/**
 * Response shared by the server following an /api/user call. Only one of |accessCode| and |error|
 * will be shared, validation of which is expected to be done by the API request user.
 */
export interface IApplicationResponse {
    // Iff the application was successful:
    accessCode?: string;

    // Iff the application was not successful:
    error?: string;
}
