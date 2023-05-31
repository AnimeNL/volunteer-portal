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
    'Available senior volunteers will be highlighted on this overview page.',
    'There will be beer in the Volunteer Lounge at 21:00 and 00:00 on Friday and Saturday!',
];

// Educational messages that can be displayed on the portal for senior volunteers.
const kEducationalMessagesForSeniors = [
    'You can double click on a group of volunteers to make it the default view.',
    'Volunteers engaged in a backup shift will be displayed on the overview page.',
    'You can edit notes for events and volunteers, changes will be visible immediately!',
];

// Properties accepted by the <EducationCard> card.
export interface EducationCardProps {
    /**
     * Date and time at which the education card is being displayed. Used to seed which suggestion
     * should be displayed to the user.
     */
    dateTime: DateTime;

    /**
     * Whether to include tips for senior volunteers. They get a slightly amended environment in the
     * volunteer portal, with a different level of functionality.
     */
    displaySeniorTips: boolean;
}

// The <EducationCard> component displays a Material Card with a sequence of information about the
// volunteer portal, helping the user find their way around.
export function EducationCard(props: EducationCardProps) {
    const { dateTime, displaySeniorTips } = props;

    let message: string | undefined;
    if (!displaySeniorTips) {
        message = kEducationalMessages[dateTime.unix() % kEducationalMessages.length];
    } else {
        const totalOptions = kEducationalMessages.length + kEducationalMessagesForSeniors.length;
        const selectedOption = dateTime.unix() % totalOptions;

        if (selectedOption < kEducationalMessages.length)
            message = kEducationalMessages[selectedOption];
        else
            message = kEducationalMessagesForSeniors[selectedOption - kEducationalMessages.length];
    }

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
