import {_hash} from '../../services/helpers/helpers';

export class Service {

    /**
     *
     * @param {string} Name - Name of the service
     * @param {string} FamilyName
     * @param {string} FamilyVersion - Service's channel
     */
    constructor(private Name: string,
                private FamilyName: string,
                private FamilyVersion: string) {
    }

    getName(): string {
        return this.Name;
    }

    setName(name: string): void {
        this.Name = name;
    }

    getKey(): string {
        return this.Name;
    }

    setKey(key: string): void {
        this.FamilyName = key;
    }

    getChannel(): string {
        return this.FamilyVersion;
    }

    setChannel(channel: string): void {
        this.FamilyVersion = channel;
    }

    getPrefix() {
        return _hash(this.FamilyName).substring(0, 6);
    }
}