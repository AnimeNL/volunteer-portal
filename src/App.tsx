// Copyright 2021 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

import AccessAlarmIcon from '@material-ui/icons/AccessAlarm';
import { h } from 'preact';

import { ConfigurationImpl } from './base/ConfigurationImpl';

const config = new ConfigurationImpl();

export const App = () => {
    return <h2>hi {config.getContentEndpoint()} <AccessAlarmIcon /></h2>;
};
