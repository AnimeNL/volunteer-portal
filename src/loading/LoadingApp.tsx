// Copyright 2021 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

import LinearProgress from '@mui/material/LinearProgress';
import { h } from 'preact';

// Loading sub-application, which is responsible to displaying feedback to the user that indicates
// that the actual application is still being loaded. Not interactable.
export function LoadingApp() {
    return <LinearProgress />;
}
