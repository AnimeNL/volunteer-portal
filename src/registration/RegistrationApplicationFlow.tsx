// Copyright 2021 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

import moment from 'moment-timezone';

import { Fragment, h } from 'preact';
import { useContext, useState } from 'preact/hooks';

import AdapterMoment from '@mui/lab/AdapterMoment';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import DatePicker from '@mui/lab/DatePicker';
import FormControlLabel from '@mui/material/FormControlLabel';
import Grid from '@mui/material/Grid';
import LocalizationProvider from '@mui/lab/LocalizationProvider';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import { AppContext } from '../AppContext';
import { EnvironmentEvent } from '../base/Environment';
import { RegistrationContent } from './RegistrationContent';

// Properties accepted by the <RegistrationApplicationFlow> component.
export interface RegistrationAppProps {
    // The event for which the application flow is being started. Guaranteed to be available by the
    // time this component is being rendered.
    event: EnvironmentEvent;
}

// Responsible for displaying the registration application flow, which allows people to apply to
// join whichever volunteering team the page is being displayed for.
export function RegistrationApplicationFlow(props: RegistrationAppProps) {
    const { content, environment, user } = useContext(AppContext);
    const { event } = props;

    // (1) Get the environment-specific portions of the application page.
    const header = content.get(`/registration/${event.identifier}/application-header.html`);
    const hotelEnabled = environment.title.includes('Steward');

    // (2) Predefined options for the select fields.
    const kGenderOptions = {
        female: 'Female',
        male: 'Male',
        other: 'Other',
        na: 'Prefer not to say',
    };

    const kTshirtOptions = {
        xs: 'Extra small (XS)',
        s: 'Small (S)',
        m: 'Medium (M)',
        l: 'Large (L)',
        xl: 'Extra large (XL)',
        xxl: 'Extra-extra large (XXL)',
        none: 'No t-shirt',
    };

    // (3) Values for each of the fields within the form.
    const [ dateOfBirth, setDateOfBirth ] = useState(new Date());

    return (
        <Fragment>
            { header &&
                <RegistrationContent event={event} contentPage={header} /> }
            <Grid container
                  sx={{ paddingX: 2 }}
                  spacing={2}>

                <Grid item xs={12}>
                    <Typography variant="h6">
                        Personal information
                    </Typography>
                </Grid>

                <Grid item xs={6}>
                    <TextField required fullWidth
                               id="personal-first-name"
                               label="First name(s)" />
                </Grid>
                <Grid item xs={6}>
                    <TextField required fullWidth
                               id="personal-last-name"
                               label="Last name" />
                </Grid>
                <Grid item xs={12}>
                    <LocalizationProvider dateAdapter={AdapterMoment} dateLibInstance={moment}>
                        <DatePicker renderInput={ params => <TextField {...params} fullWidth /> as any }
                                    label="Date of birth"
                                    views={['year', 'month', 'day']} openTo="year" disableFuture
                                    value={dateOfBirth}
                                    onChange={value => setDateOfBirth(value!)} />
                    </LocalizationProvider>
                </Grid>

                { /* Date of birth */ }

                <Grid item xs={12}>
                    <TextField required fullWidth
                               type="email"
                               id="personal-email-address"
                               label="E-mail address" />
                </Grid>
                <Grid item xs={12}>
                    <TextField required fullWidth
                               type="tel"
                               id="personal-phone-number"
                               label="Phone number" />
                </Grid>

                <Grid item xs={6}>
                    <TextField required select fullWidth
                               id="personal-gender"
                               label="Gender">
                        { Object.entries(kGenderOptions).map(([ value, label ]) =>
                            <MenuItem key={value} value={value}>{label}</MenuItem> ) }
                    </TextField>
                </Grid>
                <Grid item xs={6}>
                    <TextField required select fullWidth
                               id="personal-tshirt"
                               label="T-shirt size">
                        { Object.entries(kTshirtOptions).map(([ value, label ]) =>
                            <MenuItem key={value} value={value}>{label}</MenuItem> ) }
                    </TextField>
                </Grid>

            </Grid>
            <Grid container
                  sx={{ padding: 2 }}
                  spacing={2}>

                <Grid item xs={12}>
                    <Typography variant="h6">
                        Volunteer participation
                    </Typography>
                </Grid>

                <Grid item xs={12}>
                    <TextField multiline fullWidth
                               id="participation-comments"
                               label="Do you have any (volunteering) preferences?" />
                </Grid>

            </Grid>
            <Grid container
                  sx={{ paddingX: 2 }}
                  spacing={{ xs: 2, sm: 0 }}>

                <Grid item xs={12}>
                    <FormControlLabel control={<Checkbox />}
                                      label={`Yes, I will be fully available during ${event.name}.`} />
                </Grid>

                { hotelEnabled &&
                    <Grid item xs={12}>
                        <FormControlLabel control={<Checkbox />}
                                        label="Yes, I would like to book a hotel room at a discounted rate." />
                    </Grid> }

                <Grid item xs={12}>
                    <FormControlLabel control={<Checkbox />}
                                      label="Yes, I would like to join the private WhatsApp group." />
                </Grid>

            </Grid>

            <Grid container
                  sx={{ padding: 2, paddingTop: 1 }}
                  spacing={{ xs: 2, sm: 0 }}>

                <Grid item xs={12}>
                    <Typography variant="h6" sx={{ paddingBottom: 1 }}>
                        Mandatory paperwork
                    </Typography>
                </Grid>

                <Grid item xs={12}>
                    <FormControlLabel control={<Checkbox required />}
                                      label="Yes, I will comply with the COVID-19 requirements." />
                </Grid>
                <Grid item xs={12}>
                    <FormControlLabel control={<Checkbox required />}
                                      label="Yes, I accept the GDPR and data sharing policies." />
                </Grid>

                <Grid item xs={12} sx={{ paddingTop: 2 }}>
                    <Button variant="contained">
                        Submit your application
                    </Button>
                </Grid>
            </Grid>

        </Fragment>
    );
}
