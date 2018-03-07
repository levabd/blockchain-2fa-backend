import {Log} from 'hlf-node-utils';

/***
 * Validator class
 */
export class Validator {

    private errors = {};
    private RULE_VALUE_DELIMITER = ',';
    private RULE_VERSUS_VALUE_DELIMITER = ':';
    private RULES_DELIMITER = '|';

    constructor(private data?: any, private rules?: any, private messages?: any) {
        const fieldsToHandle = Object.keys(this.data);

        Object.keys(this.rules).forEach(fieldNameToCheck => {
            if (fieldsToHandle.indexOf(fieldNameToCheck) === -1) {
                Log.app.warn(`Validator@constructor: Try to use rule name: ${fieldNameToCheck}, but it does not exists in body`);
                return;
            }
            const fieldRules = this.rules[fieldNameToCheck].split(this.RULES_DELIMITER);
            for (const rule of fieldRules) {
                try {
                    let splitted = rule.split(this.RULE_VERSUS_VALUE_DELIMITER);

                    // regex
                    if (splitted.length && splitted[0] === 'regex') {
                        this.checkRegex(fieldNameToCheck, new RegExp(splitted[1].slice(1, -1)));
                        continue;
                    }

                    // in, max lenght, date, requiredIfNot
                    if (splitted.length) {
                        const funcName = this.capitalizeFirstLetter(splitted.shift());
                        this[`check${funcName}`](fieldNameToCheck, splitted);
                        continue;
                    }

                    // required. number, string, nullable
                    this['check' + this.capitalizeFirstLetter(splitted[0])](fieldNameToCheck);

                } catch (e) {
                    Log.app.warn(`Validator@constructor: validation type is not suported`, e);
                }
            }
        });
    }

    getErrors(): any {
        return this.errors;
    }

    isEmpty(): boolean {
        return Object.keys(this.errors).length === 0;
    }

    fails(): boolean {
        return !this.isEmpty();
    }

    addError(fieldName: string, mesage: string, checkType: string): void {
        if (!this.errors[fieldName]) {
            this.errors[fieldName] = [];
        }

        const checkMessage = this.messages[`${fieldName}.${checkType}`];

        this.errors[fieldName].push(checkMessage || mesage);
    }

    // noinspection TsLint
    private checkRequired(field: string): void {
        if (!this.data[field] || this.data[field] === '') {
            this.addError(field, `The field '${field}' is required.`, 'required');
        }
    }

    // noinspection TsLint
    private checkIn(field: string, list: string): void {
        if (list[0].split(this.RULE_VALUE_DELIMITER).indexOf(this.data[field]) === -1) {
            this.addError(field, `The field '${field}' must be one of the: ${list}.`, 'in');
        }
    }

    // noinspection TsLint
    private checkMaxStringLength(field: string, value: string): void {
        if (this.data[field].length >= parseInt(value, 10)) {
            this.addError(field, `The field '${field}' must be less than: ${value[0]}.`, 'maxStringLength');
        }
    }

    // noinspection TsLint
    private checkNumber(field: string): void {
        if (typeof this.data[field] !== 'number') {
            this.addError(field, `The field '${field}' must be a number.`, 'number');
        }
    }

    // noinspection TsLint
    private checkString(field: string): void {
        if (typeof this.data[field] !== 'string') {
            this.addError(field, `The field '${field}' must be a string.`, 'string');
        }
    }

    // noinspection TsLint
    private checkDate(field: string, format: string) {
        if (!this.isValidDate(this.data[field])) {
            this.addError(field, `The field '${field}' must be a valid date format: MM/DD/YYYY.`, 'date');
        }
    }

    // noinspection TsLint
    private checkNullable(field: string): void {
        // todo some action may be
    }

    // noinspection TsLint
    private checkRegex(field: string, pattern: RegExp): void {
        const found =  this.data[field].match(pattern);
        if (!found) {
            this.addError(field, `The '${field}' format is invalid.`, 'regex');
        }
    }

    // noinspection TsLint
    private checkRequiredIfNot(field: string, dependField: string[]): void {
        if (!this.data[dependField[0]]) {
            if (!this.data[field]) {
                this.addError(field, `The field '${field}' is required when ${dependField[0]} is empty.`, 'requiredIfNot');
            }
        }
    }

    private isValidDate(date: string): boolean {
        const matches = /^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})$/.exec(date);
        if (matches == null) {
            return false;
        }
        const d = parseInt(matches[2], 10);
        const m = parseInt(matches[1], 10) - 1;
        const y = parseInt(matches[3], 10);
        const composedDate = new Date(y, m, d);
        return composedDate.getDate() == d &&
            composedDate.getMonth() == m &&
            composedDate.getFullYear() == y;
    }

    private capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }
}
