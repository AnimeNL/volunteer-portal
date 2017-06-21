// Copyright 2017 Peter Beverloo. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import Convention from './convention/convention';

// Application class that services the main layout, but also should be available to each of the
// views included with the volunteer portal. Grants access to the convention, the logged in user and
// other global state that is significant for each of the views.
export class App {
    constructor() {
        this.convention_ = new Convention();
        this.router_ = null;
        this.title_ = null;
        this.user_ = 'Peter';
    }

    // Gets the global instance of the Convention object the portal is servicing.
    get convention() { return this.convention_; }

    // Gets the title representing the view that's currently being displayed.
    get title() { return this.title_; }

    // Sets the title of the current view to |title|. This will update both the page <title> and the
    // layout header element with the given value.
    set title(title) {
        this.router_.title = title + ' | ' + this.convention_.name;
        this.title_ = title;
    }

    // Gets the User object representing the user that's logged in. Guaranteed to be set.
    get user() { return this.user_; }

    // Configures the router responsible for ensuring that the right view is being presented to the
    // user. Will be called automatically by the Aurelia framework upon initialization.
    configureRouter(config, router) {
        this.router_ = router;

        // Enable use of the History API for in-page navigation.
        config.options.pushState = true;
        config.options.root = '/';

        // Register the routes available in the Volunteer Portal.
        config.map([
            { route: '',                            name: 'overview',           moduleId: 'views/overview' },
            { route: 'volunteers',                  name: 'volunteers',         moduleId: 'views/volunteers' },
            { route: 'volunteers/:name?/schedule',  name: 'volunteerSchedule',  moduleId: 'views/volunteer-schedule' }
        ]);
    }

    // Loads information about the identified user, if any, as well as the convention that's being
    // serviced by the portal. Returns a promise once complete with a boolean indicating whether the
    // local user is identified to an account.
    load() {
        return Promise.resolve(false /* identified */);
    }
}
