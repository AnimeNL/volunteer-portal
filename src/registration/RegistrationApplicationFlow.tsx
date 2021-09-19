// Copyright 2021 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

import moment from 'moment-timezone';

import { Fragment, h } from 'preact';
import { useContext, useState } from 'preact/hooks';

import AdapterMoment from '@mui/lab/AdapterMoment';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import CircularProgress from '@mui/material/CircularProgress';
import Collapse from '@mui/material/Collapse';
import DatePicker from '@mui/lab/DatePicker';
import FormControlLabel from '@mui/material/FormControlLabel';
import Grid from '@mui/material/Grid';
import LocalizationProvider from '@mui/lab/LocalizationProvider';
import MenuItem from '@mui/material/MenuItem';
import SendIcon from '@mui/icons-material/Send';
import { SxProps, Theme } from '@mui/system';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import { AppContext } from '../AppContext';
import { EnvironmentEvent } from '../base/Environment';
import { Link } from '../Link';
import { RegistrationContent } from './RegistrationContent';
import { UserApplication } from '../base/User';

// CSS customizations applied to the <RegistrationApplicationFlow> component.
const kStyles: { [key: string]: SxProps<Theme> } = {
    submitErrorList: {
        color: 'error.main',

        '& ul': {
            marginTop: 0,
        }
    },
    submitButtonProgress: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        marginTop: '-12px',
        marginLeft: '-12px',
    },
};

// Properties accepted by the <RegistrationApplicationFlow> component.
export interface RegistrationAppProps {
    // The event for which the application flow is being started. Guaranteed to be available by the
    // time this component is being rendered.
    event: EnvironmentEvent;
}

// Responsible for displaying a message to the (now) signed in user when their application has been
// successfully submitted. They will see a confirmation message, including their personal code.
function RegistrationApplicationSubmittedFlow(props: RegistrationAppProps) {
    const { content, user } = useContext(AppContext);
    const { event } = props;

    const message = content.get(`/registration/${event.identifier}/application-submitted.html`);
    return (
        <Fragment>
            { message && <RegistrationContent event={event} contentPage={message} /> }

            <Box sx={{ paddingX: 2, paddingBottom: 2 }}>
                <p>
                    <strong>E-mail address</strong>: {user.emailAddress}<br />
                    <strong>Access code</strong>: {user.accessCode}
                </p>

                <Link href={`/registration/${event.identifier}/`}>
                    « Previous page
                </Link>
            </Box>
        </Fragment>
    );
}

// Responsible for displaying the registration application flow, which allows people to apply to
// join whichever volunteering team the page is being displayed for.
export function RegistrationApplicationFlow(props: RegistrationAppProps) {
    const { content, environment, user } = useContext(AppContext);
    const { event } = props;

    if (user.authenticated) {
        const eventRole = user.events.get(event.identifier);
        if (eventRole && eventRole !== 'Unregistered')
            return <RegistrationApplicationSubmittedFlow event={event} />
    }

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
    const [ errors, setErrors ] = useState<string[]>([]);
    const [ submitting, setSubmitting ] = useState(false);

    const [ firstName, setFirstName ] = useState(/* empty string: */ '');
    const [ firstNameError, setFirstNameError ] = useState(false);

    const [ lastName, setLastName ] = useState(/* empty string: */ '');
    const [ lastNameError, setLastNameError ] = useState(false);

    const [ dateOfBirth, setDateOfBirth ] = useState(moment());
    const [ dateOfBirthError, setDateOfBirthError ] = useState(false);

    const [ emailAddress, setEmailAddress ] = useState(/* empty string: */ '');
    const [ emailAddressError, setEmailAddressError ] = useState(false);

    const [ phoneNumber, setPhoneNumber ] = useState(/* empty string: */ '');
    const [ phoneNumberError, setPhoneNumberError ] = useState(false);

    const [ gender, setGender ] = useState(/* empty string: */ '');
    const [ genderError, setGenderError ] = useState(false);

    const [ shirtSize, setShirtSize ] = useState(/* empty string: */ '');
    const [ shirtSizeError, setShirtSizeError ] = useState(false);

    const [ preferences, setPreferences ] = useState(/* empty string: */ '');

    const [ available, setAvailable ] = useState(false);
    const [ hotel, setHotel ] = useState(false);
    const [ whatsApp, setWhatsApp ] = useState(false);

    const [ covidRequirements, setCovidRequirements ] = useState(false);
    const [ covidRequirementsError, setCovidRequirementsError ] = useState(false);

    const [ gdprRequirements, setGdprRequirements ] = useState(false);
    const [ gdprRequirementsError, setGdprRequirementsError ] = useState(false);

    // (4) The submit event, which will enable the user to submit the form with all information
    // contained therein, after successful validation.
    function handleSubmit(event: h.JSX.TargetedEvent<HTMLFormElement>) {
        event.preventDefault();

        let application: UserApplication = {} as UserApplication;
        let validationErrors = [];

        // Personal information:
        // -----------------------------------------------------------------------------------------

        if (!firstName || !firstName.length) {
            setFirstNameError(true);
            validationErrors.push('Please enter your first name.');
        } else {
            setFirstNameError(false);
            application.firstName = firstName;
        }

        if (!lastName || !lastName.length) {
            setLastNameError(true);
            validationErrors.push('Please enter your last name.');
        } else {
            setLastNameError(false);
            application.lastName = lastName;
        }

        const kCurrentYear = (new Date).getFullYear();
        if (!dateOfBirth || dateOfBirth.year() < 1900 || dateOfBirth.year() > kCurrentYear) {
            setDateOfBirthError(true);
            validationErrors.push('Please enter your full date of birth.');
        } else {
            setDateOfBirthError(false);
            application.dateOfBirth = dateOfBirth.format('YYYY-MM-DD');
        }

        if (!emailAddress || !emailAddress.length) {
            setEmailAddressError(true);
            validationErrors.push('Please enter your personal e-mail address.');
        } else {
            setEmailAddressError(false);
            application.emailAddress = emailAddress;
        }

        if (!phoneNumber || !phoneNumber.length) {
            setPhoneNumberError(true);
            validationErrors.push('Please enter your mobile phone number.');
        } else {
            setPhoneNumberError(false);
            application.phoneNumber = phoneNumber;
        }

        if (!gender || !gender.length) {
            setGenderError(true);
            validationErrors.push('Please enter your preferred gender.');
        } else {
            setGenderError(false);
            application.gender = gender;
        }

        if (!shirtSize || !shirtSize.length) {
            setShirtSizeError(true);
            validationErrors.push('Please enter your preferred t-shirt size.');
        } else {
            setShirtSizeError(false);
            application.shirtSize = shirtSize;
        }

        // Participative information:
        // -----------------------------------------------------------------------------------------

        application.preferences = preferences;

        application.available = !!available;
        application.hotel = !!hotel;
        application.whatsApp = !!whatsApp;

        // Requirements:
        // -----------------------------------------------------------------------------------------

        if (!covidRequirements) {
            setCovidRequirementsError(true);
            validationErrors.push('Please indicate that you will comply with the COVID-19 requirements.');
        } else {
            setCovidRequirementsError(false);
            application.covidRequirements = true;
        }

        if (!gdprRequirements) {
            setGdprRequirementsError(true);
            validationErrors.push('Please indicate that you accept the GDPR and data sharing policies.');
        } else {
            setGdprRequirementsError(false);
            application.gdprRequirements = true;
        }

        setErrors(validationErrors);
        if (validationErrors.length)
            return;

        setSubmitting(true);
        user.submitApplication(application).then(response => {
            setSubmitting(false);

            if (response.success)
                alert('Application was submitted successfully.');
            else
                setErrors([ response.error! ]);
        });
    }

    return (
        <form onSubmit={formEvent => handleSubmit(formEvent)} noValidate>
            { header &&
                <RegistrationContent event={event} contentPage={header} /> }

            <Collapse sx={kStyles.submitErrorList} in={errors.length > 0}>
                <ul>
                    { errors.map(message => <li>{message}</li>) }
                </ul>
            </Collapse>

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
                               value={firstName}
                               onChange={changeEvent => setFirstName(changeEvent.target.value)}
                               error={firstNameError}
                               label="First name(s)" />
                </Grid>
                <Grid item xs={6}>
                    <TextField required fullWidth
                               id="personal-last-name"
                               value={lastName}
                               onChange={changeEvent => setLastName(changeEvent.target.value)}
                               error={lastNameError}
                               label="Last name" />
                </Grid>
                <Grid item xs={12}>
                    <LocalizationProvider dateAdapter={AdapterMoment} dateLibInstance={moment}>
                        <DatePicker renderInput={ params =>
                                        <TextField {...params}
                                                   error={dateOfBirthError}
                                                   fullWidth /> as any }
                                    label="Date of birth"
                                    views={['year', 'month', 'day']} openTo="year" disableFuture
                                    value={dateOfBirth}
                                    onChange={value => setDateOfBirth(value!)} />
                    </LocalizationProvider>
                </Grid>
                <Grid item xs={12}>
                    <TextField required fullWidth
                               type="email"
                               id="personal-email-address"
                               value={emailAddress}
                               onChange={changeEvent => setEmailAddress(changeEvent.target.value)}
                               error={emailAddressError}
                               label="E-mail address" />
                </Grid>
                <Grid item xs={12}>
                    <TextField required fullWidth
                               type="tel"
                               id="personal-phone-number"
                               value={phoneNumber}
                               onChange={changeEvent => setPhoneNumber(changeEvent.target.value)}
                               error={phoneNumberError}
                               label="Phone number" />
                </Grid>
                <Grid item xs={6}>
                    <TextField required select fullWidth
                               id="personal-gender"
                               value={gender}
                               onChange={changeEvent => setGender(changeEvent.target.value)}
                               error={genderError}
                               label="Gender">
                        { Object.entries(kGenderOptions).map(([ value, label ]) =>
                            <MenuItem key={value} value={value}>{label}</MenuItem> ) }
                    </TextField>
                </Grid>
                <Grid item xs={6}>
                    <TextField required select fullWidth
                               id="personal-tshirt"
                               value={shirtSize}
                               onChange={changeEvent => setShirtSize(changeEvent.target.value)}
                               error={shirtSizeError}
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
                               value={preferences}
                               onChange={changeEvent => setPreferences(changeEvent.target.value)}
                               label="Do you have any (volunteering) preferences?" />
                </Grid>

            </Grid>
            <Grid container
                  sx={{ paddingX: 2 }}
                  spacing={{ xs: 2, sm: 0 }}>

                <Grid item xs={12}>
                    <FormControlLabel control={<Checkbox checked={available}
                                                         onChange={event => setAvailable(event.target.checked)} />}
                                      label={`Yes, I will be fully available during ${event.name}.`} />
                </Grid>

                { hotelEnabled &&
                    <Grid item xs={12}>
                        <FormControlLabel control={<Checkbox checked={hotel}
                                                             onChange={event => setHotel(event.target.checked)} />}
                                        label="Yes, I would like to book a hotel room at a discounted rate." />
                    </Grid> }

                <Grid item xs={12}>
                    <FormControlLabel control={<Checkbox checked={whatsApp}
                                                         onChange={event => setWhatsApp(event.target.checked)} />}
                                      label="Yes, I would like to join the private WhatsApp group." />
                </Grid>

            </Grid>

            <Grid container
                  sx={{ padding: 2, paddingTop: 1 }}
                  spacing={{ xs: 2, sm: 0 }}>

                <Grid item xs={12}>
                    <Typography variant="h6">
                        Mandatory paperwork
                    </Typography>
                </Grid>

                <Grid item xs={12}>
                    <FormControlLabel control={<Checkbox checked={covidRequirements}
                                                         onChange={event => setCovidRequirements(event.target.checked)} />}
                                      sx={covidRequirementsError ? { color: 'error.main' } : {}}
                                      label="Yes, I will comply with the COVID-19 requirements." />
                </Grid>
                <Grid item xs={12}>
                    <FormControlLabel control={<Checkbox checked={gdprRequirements}
                                                         onChange={event => setGdprRequirements(event.target.checked)} />}
                                      sx={gdprRequirementsError ? { color: 'error.main' } : {}}
                                      label="Yes, I accept the GDPR and data sharing policies." />
                </Grid>

                <Grid item xs={12} sx={{ paddingTop: 2 }}>
                    <Box sx={{ display: 'inline-block', position: 'relative' }}>
                        <Button disabled={submitting}
                                endIcon={ <SendIcon /> }
                                type="submit"
                                variant="contained">
                            Submit your application
                        </Button>
                        { submitting &&
                            <CircularProgress sx={kStyles.submitButtonProgress} size={24} /> }
                    </Box>
                </Grid>
            </Grid>
        </form>
    );
}
