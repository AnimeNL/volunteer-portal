// Copyright 2022 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

import { Fragment, h } from 'preact';
import { route } from 'preact-router';
import { useContext, useMemo, useState } from 'preact/hooks';

import Alert from '@mui/material/Alert';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemText from '@mui/material/ListItemText';
import ListItem from '@mui/material/ListItem';
import NotesIcon from '@mui/icons-material/Notes';
import Paper from '@mui/material/Paper';
import ReadMoreIcon from '@mui/icons-material/ReadMore';
import { SxProps, Theme, lighten } from '@mui/system';

import { AppContext } from '../../AppContext';
import { AppTitle } from '../../AppTitle';
import { DateTime } from '../../base/DateTime';
import { Event } from '../../base/Event';
import { EventListItem } from '../components/EventListItem';
import { Markdown } from '../components/Markdown';
import { NotesEditor } from '../components/NotesEditor';
import { ShiftListItem } from '../components/ShiftListItem';
import { SubTitle } from '../components/SubTitle';
import { uploadNotes } from '../../base/Notes';

// CSS customizations applied to the <EventListView>.
const kStyles: { [key: string]: SxProps<Theme> } = {
    actionButton: {
        backgroundColor: theme => lighten(theme.palette.primary.main, .96),
        marginLeft: 2,
        '&:hover': {
            '@media (hover: none)': {
                backgroundColor: theme => lighten(theme.palette.primary.main, .96),
            },
        }
    },
    nameTypography: {
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
    },
};

// Props made available to the <EventView> component.
export interface EventViewProps {
    /**
     * The event for which this page is being shown.
     */
    event: Event;

    /**
     * Identifier for the "inner" event for which this page will be shown. This generally is a
     * string referring to some identifier given to us by the server.
     */
    eventIdentifier: string;
};

// The <EventView> component allows display of an individual event that happens during the festival.
// Each event can have a description, one or more sessions, and be associated with the shifts of any
// number of volunteers helping out with the festival.
//
// The layout of this view is based on the shift overview page, and users are expected to navigate
// between those frequently. The event's location is one of the most important pieces of information
// to surface on this page.
export function EventView(props: EventViewProps) {
    const { event, eventIdentifier } = props;
    const { user } = useContext(AppContext);

    // Validate that the |eventIdentifier| is valid on the passed Event so that we can find the
    // appropriate information. If not, route the user back to the overview page.
    const info = event.event(eventIdentifier);
    if (!info) {
        route(`/schedule/${event.identifier}/`);
        return <></>;
    }

    const [ dateTime, setDateTime ] = useState(DateTime.local());
    // TODO: Subscribe to an effect for propagating event schedule updates.

    // TODO: Allow events to be favourited for display on the overview page.
    // TODO: Should we enable linking to a map with the location information?
    // TODO: Figure out what to do with the following:
    let canUpdateNotes = true;

    // ---------------------------------------------------------------------------------------------
    // Shifts associated with this event.
    // ---------------------------------------------------------------------------------------------

    // Compile a list of shifts associated with this event. Shifts are not necessarily aligned with
    // the event's sessions, as preparation and turn-down may be necessary. Past shifts are moved to
    // the bottom of the list, whereas the upcoming shifts are listed first.
    const shifts = useMemo(() => {
        return [ ...info.shifts ].sort((lhs, rhs) => {
            if (lhs.endTime.isBefore(dateTime) && !rhs.endTime.isBefore(dateTime))
                return 1;
            if (!lhs.endTime.isBefore(dateTime) && rhs.endTime.isBefore(dateTime))
                return -1;

            if (lhs.startTime.isBefore(rhs.startTime))
                return -1;
            if (rhs.startTime.isBefore(lhs.startTime))
                return 1;

            return 0;
        });

    }, [ dateTime, eventIdentifier ]);

    // ---------------------------------------------------------------------------------------------
    // Note editing functionality for seniors.
    // ---------------------------------------------------------------------------------------------

    const [ noteEditorOpen, setNoteEditorOpen ] = useState<boolean>(false);

    // Uploads the given |notes| after the user made a change in the notes editor. This initiates a
    // network call, and may take an arbitrary amount of time to complete.
    async function commitNoteEditor(notes: string) {
        if (!info)
            return { error: 'Component has been detached' };

        try {
            const result =
                await uploadNotes(user, event.identifier, 'event', info.identifier, notes);

            if (result.error)
                return { error: result.error };

            info.notes = result.notes;
            return true;

        } catch (error) {
            return { error: 'Unable to upload the notes: ' + error };
        }
    }

    return (
        <Fragment>
            <AppTitle title={info.sessions[0].name} />
            <Paper elevation={2} sx={{ maxWidth: '100vw', marginTop: { lg: 2 } }}>
                <List>
                    <ListItem>
                        <ListItemAvatar>
                            <Avatar alt={info.sessions[0].name}>
                                <ReadMoreIcon />
                            </Avatar>
                        </ListItemAvatar>
                        <ListItemText primaryTypographyProps={{ sx: kStyles.nameTypography }}
                                      primary={info.sessions[0].name}
                                      secondary={info.sessions[0].location.name} />

                            { canUpdateNotes &&
                                    <IconButton onClick={() => setNoteEditorOpen(true)}
                                                color="primary" size="medium"
                                                sx={kStyles.actionButton}>
                                        <NotesIcon />
                                    </IconButton> }

                    </ListItem>
                </List>
            </Paper>

            { info.notes &&
                <Fragment>
                    <SubTitle>Notes</SubTitle>
                    <Paper elevation={2} sx={{ p: 2 }}>
                        <Markdown content={info.notes} />
                    </Paper>
                </Fragment> }

            <SubTitle>Sessions</SubTitle>
            <Paper sx={{ maxWidth: '100vw' }}>
                { info.sessions[0].event.hidden &&
                    <Fragment>
                        <Alert severity="info">
                            { info.sessions.length === 1 && 'This session is ' }
                            { info.sessions.length > 1 && 'These sessions are ' }
                            not visible to visitors.
                        </Alert>
                        <Divider />
                    </Fragment> }
                <List disablePadding>
                    { info.sessions.map(session =>
                        <EventListItem noVisibilityHighlight
                                       dateTime={dateTime}
                                       session={session}
                                       timeDisplay="absolute" /> )}
                </List>
            </Paper>

            { shifts.length > 0 &&
                <Fragment>
                    <SubTitle>Volunteers</SubTitle>
                        <Paper sx={{ maxWidth: '100vw' }}>
                            <List disablePadding>
                                { shifts.map(shift =>
                                    <ShiftListItem dateTime={dateTime}
                                                   display="volunteer"
                                                   event={event}
                                                   shift={shift} /> ) }
                            </List>
                        </Paper>
                </Fragment> }

            { canUpdateNotes &&
                <NotesEditor open={noteEditorOpen}
                             notes={info.notes}
                             requestClose={() => setNoteEditorOpen(false)}
                             requestSave={commitNoteEditor} /> }

        </Fragment>
    );
}
