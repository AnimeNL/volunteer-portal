// Copyright 2021 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

import { Fragment, h } from 'preact';

import DarkModeIcon from '@mui/icons-material/DarkMode';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Paper from '@mui/material/Paper';
import Switch from '@mui/material/Switch';
import Typography from '@mui/material/Typography';

import { AppTitle } from '../../AppTitle';
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

    // TODO: Behaviour
    // TODO: Date & time overrides

    // ---------------------------------------------------------------------------------------------

    return (
        <Fragment>
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
            <Paper elevation={2} sx={{ p: 2 }}>
                <Typography variant="body1">
                    <em>Behaviour options go here.</em>
                </Typography>
            </Paper>
            <SubTitle>Date &amp; time overrides</SubTitle>
            <Paper elevation={2} sx={{ p: 2 }}>
                <Typography variant="body1">
                    <em>Date and time options go here.</em>
                </Typography>
            </Paper>
        </Fragment>
    );
}
