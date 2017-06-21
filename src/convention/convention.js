export class Convention {
    constructor(name) {
        this.name = name;
        this.user = 'Peter';

        this.volunteers = [
            'Ferdi',
            'Patrick',
            'Peter'
        ];
    }

    load() {
        return Promise.resolve();
    }
}
