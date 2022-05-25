// Copyright 2022 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

import { h } from 'preact';
import { useMemo } from 'preact/compat';
import { route } from 'preact-router';

import Avatar from '@mui/material/Avatar';
import EventIcon from '@mui/icons-material/Event';
import List from '@mui/material/List';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import MapsHomeWorkIcon from '@mui/icons-material/MapsHomeWork';
import Popover from '@mui/material/Popover';
import ReadMoreIcon from '@mui/icons-material/ReadMore';
import { SxProps, Theme } from '@mui/system';
import { styled } from '@mui/material/styles';

import { DarkModeCapableAlert } from './DarkModeCapableAlert';
import { Event } from '../../base/Event';
import { NormalizeString, StringScoreEx } from '../../base/StringScore';

// CSS customizations applied to the <EventListItem> component.
const kStyles: { [key: string]: SxProps<Theme> } = {
    container: theme => ({
        width: `calc(100vw - ${theme.spacing(16)})`,
        [theme.breakpoints.up('md')]: {
            width: '50vw',
        }
    }),
    label: {
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
    },
};

// Specialization of <ListItemIcon> where the containing icon will be centered, rather than start-
// aligned. This enables it to look consistent when shown together with avatars.
const ListItemCenteredIcon = styled(ListItemIcon)(({ theme }) => ({
    paddingLeft: theme.spacing(.5),
}));

// Regular <Avatar> component except for the sizing, which has been made smaller for search results
// to be presented in a consistently sized manner. Avatars are conventionally larger than icons.
const SmallAvatar = styled(Avatar)(({ theme }) => ({
    width: theme.spacing(4),
    height: theme.spacing(4),
}));

// Structure describing an individual search result.
export interface SearchResult {
    /**
     * Type of search result to display.
     */
    type: 'area' | 'event' | 'location' | 'volunteer';

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

    /**
     * The search result's score. We use a string scoring algorithm that issues a score between 0
     * and 1, however, search type bonuses may lead to scores beyond 1.
     */
    score: number;
}

// Amount of fuzziness to apply to the search results. While this allows minor compensation for
// typos, a high value could lead to less relevant results being presented to the user.
const kSearchScoreFuzziness = 0.04;

// Minimum search score required for a result to be considered for presentation to the user.
const kSearchScoreMinimum = 0.37;

// Different types of search results are prioritized differently, based on the likelihood of a user
// searching for that sort of content combined with the assumed volume of possible results within.
const kSearchScoreTypeBonus: { [K in SearchResult['type']]: number } = {
    area: 0.1,
    event: 0,
    location: 0.1,
    volunteer: 0.18,
};

// Searches the |event| for the given |query|, and returns the results, if any.
//
// In the first stage, we iterate through all of the areas, events, locations and volunteers, and
// apply a string similarity score using Joshaven Potter's string score library. A minor amount of
// fuzzing is allowed, in order to correct for the most obvious of typos.
//
// Different entity types get a different score "bonus" applied to them. This bonus is decided based
// on the relative importance and likelihood of people searching for it. Volunteers are assumed to
// be more interested in Joe, a fellow volunteer, than the "Joe Painting" session during the event.
//
// The returned array of search results will be sorted by priority, based on returning no more than
// |limit| results. The |limit|ing is particularly useful for the inline search functionality.
export function Search(event: Event, query: string, limit?: number): [ number, SearchResult[] ] {
    const baseUrl = `/schedule/${event.identifier}`;

    const normalizedQuery = NormalizeString(query);
    const results: SearchResult[] = [];

    // Priority (1): Volunteers
    for (const volunteer of event.volunteers()) {
        const score = StringScoreEx(volunteer.name, query, normalizedQuery, kSearchScoreFuzziness);
        if (score < kSearchScoreMinimum)
            continue;

        results.push({
            type: 'volunteer',
            avatar: volunteer.avatar,
            href: `${baseUrl}/volunteers/${volunteer.identifier}/`,
            label: volunteer.name,
            score: score + kSearchScoreTypeBonus.volunteer,
        });
    }

    // Priority (2): Areas
    for (const area of event.areas()) {
        const score = StringScoreEx(area.name, query, normalizedQuery, kSearchScoreMinimum);
        if (score < kSearchScoreMinimum)
            continue;

        results.push({
            type: 'area',
            href: `${baseUrl}/events/${area.identifier}/`,
            label: area.name,
            score: score + kSearchScoreTypeBonus.area,
        });
    }

    // Priority (3): Locations
    for (const location of event.locations()) {
        const score = StringScoreEx(location.name, query, normalizedQuery, kSearchScoreMinimum);
        if (score < kSearchScoreMinimum)
            continue;

        results.push({
            type: 'location',
            href: `${baseUrl}/events/${location.area.identifier}/${location.identifier}/`,
            label: location.name,
            score: score + kSearchScoreTypeBonus.location,
        });
    }

    // Priority (4): Events
    for (const info of event.events()) {
        const [ session ] = info.sessions;

        const score = StringScoreEx(session.name, query, normalizedQuery, kSearchScoreMinimum);
        if (score < kSearchScoreMinimum)
            continue;

        results.push({
            type: 'event',
            href: `${baseUrl}/event/${info.identifier}/`,
            label: session.name,
            score: score + kSearchScoreTypeBonus.event,
        });
    }

    // Sort the |results| in descending order based on the score they have been assigned by the
    // string comparison algorithm. Then limit the return value to the result limits, if any.
    results.sort((lhs, rhs) => {
        if (lhs.score === rhs.score)
            return 0;

        return lhs.score > rhs.score ? -1 : 1;
    });

    return (!limit || results.length <= limit) ? [ results.length, results ]
                                               : [ results.length, results.splice(0, limit) ];
}

// Props accepted by the <SearchResults> component.
export interface SearchResultsProps {
    /**
     * The element to which the search results should be anchored. Can be undefined when the search
     * bar element hasn't been mounted to the DOM yet.
     */
    anchorEl?: Element;

    /**
     * Whether to commit to the first search result. The popover will be closed automatically after.
     */
    commit?: boolean;

    /**
     * The event for which search results should be shown.
     */
    event: Event;

    /**
     * Event that will be triggered when the <SearchResults> component should close.
     */
    onClose: () => void;

    /**
     * The search query for which results should be shown. The component will not display anything
     * when no query has been passed.
     */
    query?: string;
}

// The <SearchResults> component has the ability to display search results based on the current
// event. It's expected to be anchored to
export function SearchResults(props: SearchResultsProps) {
    const { anchorEl, commit, event, onClose, query } = props;

    if (!anchorEl || !query)
        return <></>;

    // The maximum number of search results to display in the inline search function.
    const kInlineSearchResultLimit = 5;

    // Memoize the search results based on the given |event| and |query|, because doing the actual
    // search is a non-trivial traversal operation.
    const [ _, searchResults ] = useMemo(() => {
        if (!query)
            return [ 0, [ /* no results */ ] ];

        return Search(event, query, kInlineSearchResultLimit);

    }, [ event, query ]);

    // If the search results should be committed, the top result will be chosen (if any) and will be
    // activated as a route. The popover will be closed automatically.
    if (commit) {
        if (searchResults.length > 0)
            route(searchResults[0].href);

        onClose(/* a navigation has been instantiated */);
        return <></>;
    }

    return (
        <Popover PaperProps={{ sx: kStyles.container }}
                 anchorEl={anchorEl}
                 anchorOrigin={{ horizontal: 'center', vertical: 'bottom' }}
                 transformOrigin={{ horizontal: 'center', vertical: 'top' }}
                 disableAutoFocus disableEnforceFocus
                 elevation={4} open={true}
                 onClose={onClose}>

            { !searchResults.length &&
                <DarkModeCapableAlert severity="warning">
                    No search results could be found.
                </DarkModeCapableAlert> }

            { searchResults.length > 0 &&
                <List disablePadding>
                    { searchResults.map(result => {
                        // TODO: Make sure that search results have the ability to wrap.

                        let avatar: h.JSX.Element | undefined;
                        switch (result.type) {
                            case 'area':
                                avatar = <ListItemCenteredIcon>
                                            <MapsHomeWorkIcon color="primary" />
                                         </ListItemCenteredIcon>;
                                break;
                            case 'event':
                                avatar = <ListItemCenteredIcon>
                                            <EventIcon color="primary" />
                                         </ListItemCenteredIcon>;
                                break;
                            case 'location':
                                avatar = <ListItemCenteredIcon>
                                            <ReadMoreIcon color="primary" />
                                         </ListItemCenteredIcon>;
                                break;
                            case 'volunteer':
                                avatar = <ListItemAvatar>
                                             <SmallAvatar alt={result.label}
                                                          src={result.avatar} />
                                         </ListItemAvatar>;
                                break;
                        }

                        function navigateToSearchResult() {
                            route(result.href);
                            onClose();
                        }

                        return (
                            <ListItemButton onClick={navigateToSearchResult}>
                                {avatar}
                                <ListItemText primaryTypographyProps={{ sx: kStyles.label }}
                                              primary={result.label} />
                            </ListItemButton>
                        );
                    }) }

                </List> }

        </Popover>
    );
}
