// Copyright 2022 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

/**
 * The /api/notes API call enables notes to be requested and stored for volunteers and events. Not
 * all users are expected to have write (or even read) access, but that's controlled by the server.
 */
export interface INotes {
    request: INotesRequest;
    response: INotesResponse;
}

/**
 * Request issued to the server when making an /api/notes call. The authentication token will be
 * shared with the server as an HTTP GET request parameter.
 */
export interface INotesRequest {
    /**
     * The authentication token through which the user is signed in.
     */
    authToken: string;

    /**
     * The event for which notes are being considered. Will be included as a GET parameter.
     */
    event: string;

    /**
     * Identifier of the entity for which notes should be considered.
     */
    entityIdentifier: string;

    /**
     * Type of entity for which notes should be considered.
     */
    entityType: INotesRequestEntityType;

    /**
     * Updated note content, if any. The |authToken| needs to have authorization to update notes in
     * order for the update to process.
     */
    update?: string;
}

/**
 * Response shared by the server following an /api/notes call.
 */
export interface INotesResponse {
    /**
     * The notes as they have been stored on the server.
     */
    notes: string;
}

/**
 * The type of entity for which notes should be requested or stored.
 */
export type INotesRequestEntityType = 'event' | 'volunteer';
