import {Convention} from './convention/convention';
import environment from './environment';

export function configure(aurelia) {
    const convention = new Convention('Anime 2018');

    aurelia.use.standardConfiguration();
    aurelia.container.registerInstance(Convention, convention);

    if (environment.debug)
        aurelia.use.developmentLogging();

    if (environment.testing)
        aurelia.use.plugin('aurelia-testing');

    convention.load()
        .then(() => aurelia.start())
        .then(() => aurelia.setRoot());
}
