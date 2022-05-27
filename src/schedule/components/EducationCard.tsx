// Copyright 2022 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

import { h } from 'preact';

import NewReleasesIcon from '@mui/icons-material/NewReleases';
import Typography from '@mui/material/Typography';

import { DateTime } from '../../base/DateTime';
import { OverviewCard } from './OverviewCard';

// Educational messages that can be displayed on the portal.
const kEducationalMessages = [
    'The volunteer portal allows you to quickly search all events, locations and volunteers!',
    'You can\'t just see your own schedule, but also the schedules of your fellow volunteers.',
    'You can quickly call one of the senior volunteers via a button on their schedules.',
    'Each of your shifts comes with clear notes in the volunteer portal.',
];

// Properties accepted by the <EducationCard> card.
export interface EducationCardProps {
    /**
     * Date and time at which the education card is being displayed. Used to seed which suggestion
     * should be displayed to the user.
     */
    dateTime: DateTime;
}

// The <EducationCard> component displays a Material Card with a sequence of information about the
// volunteer portal, helping the user find their way around.
export function EducationCard(props: EducationCardProps) {
    const message = kEducationalMessages[props.dateTime.unix() % kEducationalMessages.length];

    return (
        <OverviewCard icon={ <NewReleasesIcon color="info" /> }>
            <Typography variant="body2" gutterBottom>
                Did you know…
            </Typography>
            <Typography variant="body1">
                {message}
            </Typography>
        </OverviewCard>
    );
}
