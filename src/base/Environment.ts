// Copyright 2021 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

import type { IEnvironmentResponse, IEnvironmentResponseEvent } from '../api/IEnvironment';

export type Environment = Readonly<IEnvironmentResponse>;
export type EnvironmentEvent = Readonly<IEnvironmentResponseEvent>;
