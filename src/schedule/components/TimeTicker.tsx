// Copyright 2022 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

import { h } from 'preact';
import { useEffect, useState } from 'preact/compat';

import { DateTime } from '../../base/DateTime';

// Decides on the update frequency for a displayed timer, in number of milliseconds, based on the
// absolute difference between the |dateTime| and the |target|.
function decideUpdateFrequencyMs(dateTime: DateTime, target: DateTime): number {
    const difference = Math.abs(dateTime.moment().diff(target.moment(), 'seconds'));
    if (difference <= /* 5:00= */ 300)
        return 5000;  // every five seconds
    else if (difference <= /* 1:00:00= */ 3600)
        return 30000;  // every thirty seconds
    else
        return 60000;  // every minute
}

// Properties accepted by the <TimeTicker> component.
export interface TimeTickerProps {
    /**
     * Current date & time in the schedule application.
     */
    dateTime: DateTime;

    /**
     * Target date & time to which time should be ticking down.
     */
    target: DateTime;
}

// The <TimeTicker> component provides a <span> element with the relative time between the |target|
// and |dateTime| props, which will automatically update itself at an appropriate cadence.
export function TimeTicker(props: TimeTickerProps) {
    const [ displayDateTime, setDisplayDateTime ] = useState(props.dateTime);
    const updateFrequency = decideUpdateFrequencyMs(displayDateTime, props.target);

    useEffect(() => {
        const interval = setInterval(() => setDisplayDateTime(DateTime.local()), updateFrequency);
        return () => clearInterval(interval);

    }, [ props.dateTime, props.target, updateFrequency ]);

    return (
        <span>
            {displayDateTime.moment().to(props.target.moment())}
        </span>
    );
}
