import {Service} from './service.model';
import {EnvConfig} from '../env';
import {Component} from '@nestjs/common';

@Component()
export class ClientService {

    private services = [];

    constructor() {
        this.services.push(
            new Service(
                'kaztel',
                EnvConfig.KAZTEL_FAMILY_NAME,
                EnvConfig.KAZTEL_FAMILY_VERSION
            ),
            new Service(
                'egov',
                EnvConfig.EGOV_FAMILY_NAME,
                EnvConfig.EGOV_FAMILY_VERSION
            ),
        );
    }

    getAll(): Service[] {
        return this.services;
    }

    getService(name: string): Service {
        let servise;
        let nameLowerCase = name.toLowerCase();
        this.services.forEach(function (service) {
            if (service.getName().toLowerCase() === nameLowerCase) {
                servise = service;
            }
        });
        return servise;
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