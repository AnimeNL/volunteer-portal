// Copyright 2017 Peter Beverloo. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import {App} from './app';
import environment from './environment';

export function configure(aurelia) {
    const application = new App();

    aurelia.use.standardConfiguration();
    aurelia.container.registerInstance(App, application);

    if (environment.debug)
        aurelia.use.developmentLogging();

    if (environment.testing)
        aurelia.use.plugin('aurelia-testing');

    application.load().then(identified => {
        // TODO(peter): Implement a login screen for |!identified|.
        return aurelia.start();

    }).then(() => aurelia.setRoot());
}
