import {Convention} from '../convention/convention';
import {inject} from 'aurelia-framework';

@inject(Convention)
export class Volunteers {
    constructor(convention) {
        this.convention = convention;
    }

    activate(params, config, instruction) {
        config.navModel.setTitle('Volunteers');
    }
}
