// Copyright 2022 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

import type { INotesRequestEntityType } from '../api/INotes';

import { ApiRequest } from './ApiRequest';
import type { User } from './User';

// Asynchronous function that allows the |user| to upload updated |notes| for a particular entity.
// This function will cause an authenticated API request to the server requesting the information to
// be updated. No mechanisms are in place for dealing with uploads whilst the device is offline;
// instead, such requests are expected to fail.
export async function uploadNotes(user: User,
                                  event: string,
                                  type: INotesRequestEntityType,
                                  identifier: string,
                                  notes: string): Promise<string> {
  const request = new ApiRequest('INotes');
  const response = await request.issue({
    authToken: user.authToken,
    event,
    entityIdentifier: identifier,
    entityType: type,
    update: notes,
  });

  return response.notes;
}
