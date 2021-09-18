// Copyright 2021 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

import { Fragment, render } from 'preact';

import CssBaseline from '@mui/material/CssBaseline';

import { App } from './App';

const root = document.getElementById('root')!;
render(
    <Fragment>
        <CssBaseline />
        <App />
    </Fragment>, root);
