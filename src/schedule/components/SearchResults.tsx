// Copyright 2022 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

import { h } from 'preact';
import { useMemo } from 'preact/compat';
import { route } from 'preact-router';

import Alert from '@mui/material/Alert';
import Avatar from '@mui/material/Avatar';
import List from '@mui/material/List';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
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

// Structure describing an individual search result.
export interface SearchResult {
    /**
     * Type of search result to display.
     */
    type: 'volunteer';

    /**
     * The avatar to display at the start of the search result, if any. When given, this should be
     * a URL to the image resource that represents this result.
     */
    avatar?: string;

    /**
     * URL that the user should be routed to when they click on this search result. Required.
     */
    href: string;

    /**
     * Label that represents the search result. Required.
     */
    label: string;
}

// Searches the |event| for the given |query|, and returns the results, if any.
//
// TODO: How does search work?
//
// The returned array of search results will be sorted by priority, based on returning no more than
// |limit| results. The |limit|ing is particularly useful for the inline search functionality.
export function Search(event: Event, query: string, limit?: number): SearchResult[] {
    const baseUrl = `/schedule/${event.identifier}`;

    const normalizedQuery = query.trim().toLocaleLowerCase();
    const results: SearchResult[] = [];

    // Priority (1): Volunteers
    for (const volunteer of event.volunteers()) {
        if (!volunteer.name.toLocaleLowerCase().includes(normalizedQuery))
            continue;

        results.push({
            type: 'volunteer',
            avatar: volunteer.avatar,
            href: `${baseUrl}/volunteers/${volunteer.identifier}/`,
            label: volunteer.name,
        });
    }

    // Priority (2): Areas
    // TODO: Support areas

    // Priority (3): Locations
    // TODO: Support locations

    // Priority (4): Events
    // TODO: Support events

    // TODO: Should we collapse certain locations and events? (I.e. Bag & Changing Rooms)
    // TODO: Should we memorize historic search queries to optimize low-entropy searches?
    // TODO: Should we give more weight to matches at the beginning of the string? ("Pe[ter]")

    return (!limit || results.length <= limit) ? results
                                               : results.splice(0, limit);
}

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

    // The maximum number of search results to display in the inline search function.
    const kInlineSearchResultLimit = 3;

    // Memoize the search results based on the given |event| and |query|, because doing the actual
    // search is a non-trivial traversal operation.
    const searchResults = useMemo(() => {
        if (!query)
            return [ /* no results */ ];

        return Search(event, query, kInlineSearchResultLimit);

    }, [ event, query ]);

    return (
        <Popover PaperProps={{ sx: kStyles.container }}
                 anchorEl={anchorEl}
                 anchorOrigin={{ horizontal: 'center', vertical: 'bottom' }}
                 transformOrigin={{ horizontal: 'center', vertical: 'top' }}
                 disableAutoFocus disableEnforceFocus
                 elevation={4}
                 open={!!anchorEl && !!query}>

            { !searchResults.length &&
                <Alert severity="warning">
                    No search results could be found.
                </Alert> }

            { searchResults.length > 0 &&
                <List disablePadding>
                    { searchResults.map(result => {
                        // TODO: Display result avatars, including type-based default ones.
                        // TODO: Make sure that search results have the ability to wrap.

                        let avatar: h.JSX.Element | undefined;
                        switch (result.type) {
                            case 'volunteer':
                                avatar = <Avatar alt={result.label}
                                                 src={result.avatar} />
                                break;
                        }

                        return (
                            <ListItemButton>
                                <ListItemAvatar>
                                    {avatar}
                                </ListItemAvatar>
                                <ListItemText primary={result.label} />
                            </ListItemButton>
                        );
                    }) }
                </List> }

        </Popover>
    );
}
