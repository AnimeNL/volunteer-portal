// Copyright 2022 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

import { h } from 'preact';

import Popover from '@mui/material/Popover';
import { SxProps, Theme } from '@mui/system';

import { Event } from '../../base/Event';

// CSS customizations applied to the <EventListItem> component.
const kStyles: { [key: string]: SxProps<Theme> } = {
    container: theme => ({
        width: `calc(100vw - ${theme.spacing(16)})`,
        [theme.breakpoints.up('md')]: {
            width: '50vw',
        }
    })
};

// Props accepted by the <SearchResults> component.
export interface SearchResultsProps {
    /**
     * The element to which the search results should be anchored. Can be undefined when the search
     * bar element hasn't been mounted to the DOM yet.
     */
    anchorEl?: Element;

    /**
     * The event for which search results should be shown.
     */
    event: Event;

    /**
     * The search query for which results should be shown. The component will not display anything
     * when no query has been passed.
     */
    query?: string;
}

// The <SearchResults> component has the ability to display search results based on the current
// event. It's expected to be anchored to
export function SearchResults(props: SearchResultsProps) {
    const { anchorEl, event, query } = props;

    return (
        <Popover PaperProps={{ sx: kStyles.container }}
                 anchorEl={anchorEl}
                 anchorOrigin={{ horizontal: 'center', vertical: 'bottom' }}
                 transformOrigin={{ horizontal: 'center', vertical: 'top' }}
                 disableAutoFocus disableEnforceFocus
                 elevation={4}
                 open={!!anchorEl && !!query}>

            <b>{query}</b>

        </Popover>
    );
}
