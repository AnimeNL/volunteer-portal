// Copyright 2021 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

import { h } from 'preact';
import { useContext } from 'preact/hooks';

import { AppContext } from '../AppContext';
import { EnvironmentEvent } from '../base/Environment';

// Properties accepted by the <RegistrationApplicationFlow> component.
export interface RegistrationAppProps {
    // The event for which the application flow is being started. Guaranteed to be available by the
    // time this component is being rendered.
    event: EnvironmentEvent;
}

// Responsible for displaying the registration application flow, which allows people to apply to
// join whichever volunteering team the page is being displayed for.
export function RegistrationApplicationFlow(props: RegistrationAppProps) {
    const { user } = useContext(AppContext);

    return <b>Register today for {props.event.name}!</b>;
}
