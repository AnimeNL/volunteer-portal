// Copyright 2021 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

import { route } from 'preact-router';

// Active navigation that the user is on, as should be highlighted in the user interface.
export type NavigationActiveOptions = 'overview' | 'shifts' | 'areas' | 'volunteers' | 'admin';

// Properties that can be passed to the <Navigation> component. Values will be valid for both the
// mobile and desktop views of this component, even if their composition is entirely different.
export interface NavigationProps {
    // Which page of the navigation interface should be active?
    active: NavigationActiveOptions;

    // Badge to display for the number of active events, if any.
    badgeActiveEvents?: number;

    // Badge to display when the user's schedule has an active entry.
    badgeActiveShifts?: boolean;

    // Badge to display for the number of active volunteers, if any.
    badgeActiveVolunteers?: number;

    // Identifier of the event for which navigation is being provided.
    event: string;

    // Whether the navigation option to the administration screen should be displayed.
    showAdministration?: boolean;
};

// Performs a navigation to the selected |option| using preact-router.
export function navigateToOption(event: string, option: NavigationActiveOptions) {
    switch (option) {
        case 'admin':
        case 'areas':
        case 'shifts':
        case 'volunteers':
            route(`/schedule/${event}/${option}/`);
            break;

        default:
            route(`/schedule/${event}/`);
            break;
    }
}
