// Copyright 2021 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

import { h } from 'preact';

import { ContentLayout } from '../ContentLayout';

// The "welcome" application is a generic content page that allows the user to either sign in to
// their account, granting portal access, or refer the user to one of the other pages or components.
export function WelcomeApp() {
    return (
        <ContentLayout>
            <p>Hello, world!</p>
        </ContentLayout>
    );
}
