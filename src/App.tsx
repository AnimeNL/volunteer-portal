// Copyright 2021 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

import { hot } from 'react-hot-loader';
import React from 'react';

import { ConfigurationImpl } from './base/ConfigurationImpl';

const config = new ConfigurationImpl();

const App = () => {
  return <h2>hi {config.getContentEndpoint()}</h2>;
};

export default hot(module)(App);
