import {Service} from './service.model';
import {EnvConfig} from '../env';
import {Component} from '@nestjs/common';

@Component()
export class ClientService {

    private services = [];

    constructor() {
        this.services.push(new Service('kazahtelecom', EnvConfig.KAZAHTELECOM_KEY));
    }

    getAll(): Service[] {
        return this.services;
    }

    serviceWithNameExists(name: string): boolean {
        let found = false;
        let nameLowerCase = name.toLowerCase();
        this.services.forEach(function (service) {
            if (service.getName().toLowerCase() === nameLowerCase) {
                found = true;
            }
        });

        return found;
    }
}