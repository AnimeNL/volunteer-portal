import {Convention} from './convention/convention';
import {inject} from 'aurelia-framework';

@inject(Convention)
export class App {
    constructor(convention) {
        this.convention_ = convention;
        this.router_ = null;
    }

    configureRouter(config, router) {
        this.router_ = router;

        config.title = this.convention_.name;
        config.options.pushState = true;
        config.options.root = '/';

        config.map([
            { route: '',                            name: 'overview',           moduleId: 'views/overview' },
            { route: 'volunteers',                  name: 'volunteers',         moduleId: 'views/volunteers' },
            { route: 'volunteers/:name?/schedule',  name: 'volunteerSchedule',  moduleId: 'views/volunteer-schedule' }
        ]);
    }
}
