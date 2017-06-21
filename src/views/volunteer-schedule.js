import {Convention} from '../convention/convention';
import {inject} from 'aurelia-framework';

@inject(Convention)
export class VolunteerSchedule {
    constructor(convention) {
        this.convention_ = convention;
        this.name = null;
    }

    activate(params, config, instruction) {
        this.name = params.name || this.convention_.user;
        config.navModel.setTitle(this.name);
    }
}
