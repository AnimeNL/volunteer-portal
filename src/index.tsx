// Copyright 2021 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

import { Fragment, render } from 'preact';
import moment from 'moment-timezone';
import 'moment/locale/en-gb';

import CssBaseline from '@mui/material/CssBaseline';
import GlobalStyles from '@mui/material/GlobalStyles';

import { App } from './App';

moment.locale('en-gb');

if ('serviceWorker' in navigator && process.env.NODE_ENV !== 'development') {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js').then(registration => {
            console.log('Service Worker registered: ', registration);

            registration.update();
            registration.addEventListener('updatefound', () => {
                console.log('Service Worker updated: ', registration);
            });
        }).catch(registrationError => {
            console.log('Service Worker registration failed: ', registrationError);
        });
    });
}

const root = document.getElementById('root')!;
render(
    <Fragment>
        <CssBaseline enableColorScheme={true} />
        <GlobalStyles styles={{ strong: { fontWeight: 500 } }} />
        <App />
    </Fragment>, root);
