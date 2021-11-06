// Copyright 2021 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

import { Fragment, h } from 'preact';

import { AppTitle } from '../../AppTitle';

export interface VolunteerViewProps {
    identifier?: string;
};

export function VolunteerView(props: VolunteerViewProps) {
    return (
        <Fragment>
            <AppTitle title="V. Olunteer" />
            <p>
                VolunteerView ({props.identifier})
            </p>
        </Fragment>
    );
}
