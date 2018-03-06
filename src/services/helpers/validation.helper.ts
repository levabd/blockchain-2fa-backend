import {Log} from 'hlf-node-utils';

export class Validator {

    private errors = {};

    addError(field: string, message: string) {
        if (!this.errors[field]) {
            this.errors[field] = [];
        }
        this.errors[field].push(message);
    }

    getErrors(): any {
        return this.errors;
    }

    isEmpty(): boolean {
        return Object.keys(this.errors).length === 0;
    }

    stringFitRegex(str: string, pattern: RegExp): boolean{
        let m;
        let result = '';
        // noinspection TsLint
        while ((m = pattern.exec(str)) !== null) {
            // This is necessary to avoid infinite loops with zero-width matches
            if (m.index === pattern.lastIndex) {
                pattern.lastIndex++;
            }

            // The result can be accessed through the `m`-variable.
            m.forEach((match, groupIndex) => {
                Log.app.info(`Found match, group ${groupIndex}: ${match}`);
                result = match;
            });
        }

        return result!=='';
    }

    fails(){

    }

}
