// Copyright 2021 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

/**
 * The /api/nardo endpoint requests a consultation with a Del a Rie representative at the festival.
 */
export interface INardo {
    request: INardoRequest;
    response: INardoResponse;
}

/**
 * Request issued to the server when making an /api/nardo call.
 */
export interface INardoRequest {
    /**
     * The authentication token of the user who is making this consultation request.
     */
    authToken: string;
}

/**
 * Response returned by the server when making an /api/nardo call.
 */
export type INardoResponse = [];
