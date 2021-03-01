// Copyright 2021 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

import { Fragment, h } from 'preact';
import { route } from 'preact-router';
import { useContext } from 'preact/hooks';

import { AppContext } from '../AppContext';
import { ContentHeader } from '../ContentHeader';
import { ContentLayout } from '../ContentLayout';
import { EnvironmentEvent } from '../base/Environment';

// Properties accepted by the <RegistrationApp> component.
export interface RegistrationAppProps {
    // Slug of the event to load. Contains the remainder of contents specified in the URL's path,
    // so content beyond the slug should be ignored. Injected by preact-router.
    event?: string;
}

// The registration sub-application, which informs visitors of the perks and responsiblities of
// volunteering at the convention (as a CDN-like page system) while allowing them to register their
// interest. Registration is controlled by the environment, access to these pages is not.
export function RegistrationApp(props: RegistrationAppProps) {
    const { environment } = useContext(AppContext);

    let event: EnvironmentEvent | undefined = undefined;
    for (const details of environment.events) {
        // (1) When no event has been specified in the slug, assume that the first mentioned event
        // part of the environment should be opened. Replace the current state to reflect this.
        if (!props.event) {
            route(`/registration/${details.slug}/`, /* replace= */ true);
            return <Fragment />;
        }

        // (2) When an event has been specified, attempt to identify it in the events part of the
        // environment and store the result in |event| when successful.
        if (props.event.startsWith(details.slug)) {
            event = details;
            break;
        }
    }

    // (3) If no event could be identified, either the environment has no events or an invalid event
    // was given in the URL. Remove the user from the registration application.
    if (!event) {
        route('/', /* replace= */ true);
        return <Fragment />;
    }

    return (
        <ContentLayout>
            <ContentHeader>
                {event.name}
            </ContentHeader>
            <p>Hello</p>
        </ContentLayout>
    );
}