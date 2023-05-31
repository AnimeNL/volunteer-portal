// Copyright 2022 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

import Avatar from '@mui/material/Avatar';
import Badge from '@mui/material/Badge';
import InfoIcon from '@mui/icons-material/Info';
import OfflineBoltIcon from '@mui/icons-material/OfflineBolt';
import { SxProps, Theme } from '@mui/system';

import type { EventVolunteer } from '../../base/Event';
import { initials } from '../../base/NameUtilities';

// CSS customizations applied to the <VolunteerAvatar> component.
const kStyles: { [key: string]: SxProps<Theme> } = {
    badgeHost: {
        '& .MuiBadge-badge': {
            backgroundColor: 'background.paper',
            color: 'info.main',
            cursor: 'pointer',
            padding: '0',

            '&> svg': {
                fontSize: '1.25rem',
            }
        }
    },
    badgeSenior: {
        '& .MuiBadge-badge': {
            backgroundColor: 'background.paper',
            color: theme => {
                return theme.palette.mode === 'dark' ? '#FFD600'
                                                     : '#F9A825';
            },
            cursor: 'pointer',
            padding: '0',

            '&> svg': {
                fontSize: '1.25rem',
            }
        }
    },
    disabled: {
        filter: theme => {
            return theme.palette.mode === 'dark' ? 'grayscale(1) brightness(0.6)'
                                                 : 'grayscale(1) brightness(0.8)';
        },
    },
};

// Properties available for the <VolunteerAvatar> component.
interface VolunteerAvatarProps {
    /**
     * Whether the avatar should be styled in a disabled manner, as if it were in the past.
     */
    disabled?: boolean;

    /**
     * The volunteer for whom the avatar should be displayed.
     */
    volunteer: EventVolunteer;
}

// The <VolunteerAvatar> component can be used instead of <Avatar> to represent a volunteer.
export function VolunteerAvatar(props: VolunteerAvatarProps) {
    const { disabled, volunteer } = props;

    // Festival Hosts have a distinct function from Stewards, yet often work together with Stewards.
    // We highlight their function with a badge displayed over their avatar.
    if (volunteer.environments.hasOwnProperty('Hosts')) {
        return (
            <Badge anchorOrigin={{horizontal: 'right', vertical: 'bottom'}}
                   badgeContent={ <InfoIcon /> } color="info"
                   overlap="circular" sx={kStyles.badgeHost}>
                <Avatar sx={ disabled ? kStyles.disabled : undefined }
                        src={volunteer.avatar}>
                    {initials(volunteer.name)}
               </Avatar>
            </Badge>
        );

    // Senior Stewards are able to take charge of events and often are leading, therefore we want to
    // highlight their presence at particula revents as well.
    } else if ((volunteer.environments.hasOwnProperty('Stewards')
                   && (volunteer.environments.Stewards === 'Senior' ||
                       volunteer.environments.Stewards === 'Staff' ||
                       volunteer.environments.Stewards === 'Core Staff')) ||
               (volunteer.environments.hasOwnProperty('Gophers')
                   && volunteer.environments.Gophers === 'Staff')) {
        return (
            <Badge anchorOrigin={{horizontal: 'right', vertical: 'bottom'}}
                   badgeContent={ <OfflineBoltIcon /> } color="info"
                   overlap="circular" sx={kStyles.badgeSenior}>
                <Avatar sx={ disabled ? kStyles.disabled : undefined }
                        src={volunteer.avatar}>
                    {initials(volunteer.name)}
               </Avatar>
            </Badge>
        );
    }

    // All other volunteers will just have their avatar displayed as-is.
    return (
        <Avatar sx={ disabled ? kStyles.disabled : undefined }
                src={volunteer.avatar}>
            {initials(volunteer.name)}
       </Avatar>
    );
}
