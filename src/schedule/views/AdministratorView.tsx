// Copyright 2021 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

import { h } from 'preact';
import { useEffect, useRef, useState } from 'preact/compat';

import { del as kvDelete, set as kvSet } from 'idb-keyval';
import moment from 'moment-timezone';

import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import Paper from '@mui/material/Paper';
import Switch from '@mui/material/Switch';
import Typography from '@mui/material/Typography';

import { AppTitle } from '../../AppTitle';
import { DateTime, kDateOverrideStorageKey } from '../../base/DateTime';
import { ScheduleApp } from '../ScheduleApp';
import { SubTitle } from '../components/SubTitle';

// Properties available for the <AdministratorView> component. The <ScheduleApp> has been made
// available, as the intention for this component is to provide in-depth control.
interface AdministratorViewProps {
    app: ScheduleApp;
}

// The <AdministratorView> provides administrators with the ability to amend the appearance and
// behaviour of the portal, as well as to override the time within the application to simulate the
// situation as it would be during the convention.
export function AdministratorView(props: AdministratorViewProps) {
    const { app } = props;

    // ---------------------------------------------------------------------------------------------
    // Appearance change handlers
    // ---------------------------------------------------------------------------------------------

    function handleDarkModeToggle(event: React.ChangeEvent<HTMLInputElement>, checked: boolean) {
        app.setDarkMode(checked);
    }

    // ---------------------------------------------------------------------------------------------
    // Behaviour change handlers
    // ---------------------------------------------------------------------------------------------

    const [ dateOverrideDialogOpen, setDateOverrideDialogOpen ] = useState(false);

    const [ dateOverrideValue, setDateOverrideValue ] = useState<DateTime>(DateTime.local());
    const [ dateOverrideLabel, setDateOverrideLabel ] = useState(
        DateTime.hasOverrideDiff() ? DateTime.local().format('full')
                                   : /* no override= */ '');

    async function handleDateOverrideDelete() {
        await kvDelete(kDateOverrideStorageKey);

        DateTime.setOverrideDiff(/* reset */);
        setDateOverrideLabel(/* reset */ '');
        setDateOverrideValue(DateTime.local());
    }

    async function handleDateOverrideEditCommit(override: moment.Moment) {
        const currentMoment = moment.tz(DateTime.getDefaultTimezone());
        const overrideMoment = override.startOf('minute');

        const diffMs = overrideMoment.diff(currentMoment, 'ms');

        await kvSet(kDateOverrideStorageKey, diffMs);

        DateTime.setOverrideDiff(diffMs);
        setDateOverrideLabel(DateTime.local().format('full'));
        setDateOverrideValue(DateTime.local());
    }

    // Use a component-lifetime bounded timer to keep the date override updated.
    const interval = useRef<NodeJS.Timeout | null>();

    useEffect(() => {
        interval.current = setInterval(() => {
            if (DateTime.hasOverrideDiff() && !dateOverrideDialogOpen)
                setDateOverrideLabel(DateTime.local().format('full'));

        }, 1000);

        return () => clearInterval(interval.current!);
    }, []);

    // ---------------------------------------------------------------------------------------------

    return (
        <LocalizationProvider dateAdapter={AdapterMoment} dateLibInstance={moment}>
            <AppTitle title="Administrator Tools" />
            <Paper elevation={2} sx={{ p: 2, marginTop: { lg: 2 } }}>
                <Typography variant="body1">
                    The administrator tools allow behaviour of the client-side application to be
                    amended, primarily intended for development purposes. No warranties will be
                    provided on the partial functionality! 😄
                </Typography>
            </Paper>
            <SubTitle>Appearance</SubTitle>
            <Paper elevation={2} sx={{ px: 2 }}>
                <List>
                    <ListItem>
                        <ListItemIcon>
                            <DarkModeIcon />
                        </ListItemIcon>
                        <ListItemText primary="Dark Mode" />
                        <Switch onChange={handleDarkModeToggle}
                                checked={app.getDarkMode()}
                                edge="end" />
                    </ListItem>
                </List>
            </Paper>
            <SubTitle>Behaviour</SubTitle>
            <Paper elevation={2} sx={{ px: 2 }}>
                <List>
                    <ListItem>
                        <ListItemIcon>
                            <AccessTimeIcon />
                        </ListItemIcon>
                        <ListItemText primary="Date &amp; time override"
                                      secondary={dateOverrideLabel} />
                        { !!dateOverrideLabel &&
                            <IconButton aria-label="delete" onClick={_ => handleDateOverrideDelete()}>
                                <DeleteIcon />
                            </IconButton> }
                        <DateTimePicker open={dateOverrideDialogOpen}
                                        onAccept={value => handleDateOverrideEditCommit(value!)}
                                        onChange={value => /* discard */ 0}
                                        onClose={() => setDateOverrideDialogOpen(false)}
                                        value={dateOverrideValue.moment()}
                                        renderInput={ ({ inputRef, ...other }) =>
                                            <IconButton onClick={() => setDateOverrideDialogOpen(true)}
                                                        aria-label="edit" ref={inputRef!}>
                                                <EditIcon />
                                            </IconButton> as any }>
                        </DateTimePicker>
                    </ListItem>
                </List>
            </Paper>
        </LocalizationProvider>
    );
}
