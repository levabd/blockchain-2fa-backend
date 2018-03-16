import {Log} from 'hlf-node-utils';
import * as  changeCase from 'change-case';

/***
 * Validator class
 */
export class Validator {

    private errors = {};
    private dataTransformed = {};
    private RULE_VALUE_DELIMITER = ',';
    private RULE_VERSUS_VALUE_DELIMITER = ':';
    private RULES_DELIMITER = '|';

    constructor(private data?: any, private rules?: any, private messages?: any) {
        const fieldsToHandle = Object.keys(this.data);
        for (let f of fieldsToHandle) {
            this.dataTransformed[changeCase.snakeCase(f)] = this.data[f];
        }

        Object.keys(this.rules).forEach(fieldNameToCheck => {
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
                        try {
                            this[`check${funcName}`](fieldNameToCheck, splitted);
                        } catch (E) {
                            Log.app.warn(`Validator@constructor: funcName`, funcName, fieldNameToCheck);
                        }
                        continue;
                    }

                    // required. number, string, nullable
                    this['check' + this.capitalizeFirstLetter(splitted[0])](fieldNameToCheck);

                } catch (e) {
                    Log.app.warn(`Validator@constructor: validation type is not supported`, e);
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

    addError(fieldName: string, mesage: string, checkType?: string): void {
        if (!this.errors[fieldName]) {
            this.errors[fieldName] = [];
        }

        let checkMessage;
        if (checkType && this.messages) {
            checkMessage = this.messages[`${fieldName}.${checkType}`];
        }

        this.errors[fieldName].push(checkMessage || mesage);
    }

    // noinspection TsLint
    private checkRequired(field: string): void {
        if (!this.dataTransformed[field] || this.dataTransformed[field] === '') {
            this.addError(field, `The field '${field}' is required.`, 'required');
        }
    }

    // noinspection TsLint
    private checkBoolean(field: string): void {
        if (this.fieldIsEmpty(field)) {return;}

        if (typeof(this.dataTransformed[field]) !== typeof(true)) {
            this.addError(field, `The field '${field}' must be a boolean.`, 'number');
        }
    }

    private fieldIsEmpty(field: string):boolean {
        return this.dataTransformed[field] === undefined || this.dataTransformed[field] === '';
    }

    // noinspection TsLint
    private checkIn(field: string, list: string): void {
        if (this.fieldIsEmpty(field)) {return;}

        if (list[0].split(this.RULE_VALUE_DELIMITER).indexOf(this.dataTransformed[field]) === -1) {
            this.addError(field, `The field '${field}' must be one of the: ${list}.`, 'in');
        }
    }

    // noinspection TsLint
    private checkMaxStringLength(field: string, value: string): void {
        if (this.fieldIsEmpty(field)) {return;}

        if (this.dataTransformed[field].length >= parseInt(value, 10)) {
            this.addError(field, `The field '${field}' must be less than: ${value[0]}.`, 'maxStringLength');
        }
    }

    // noinspection TsLint
    private checkMaxNumber(field: string, value: string): void {
        if (this.fieldIsEmpty(field)) {return;}

        if (parseInt(this.dataTransformed[field], 10) >= parseInt(value[0], 10)) {
            this.addError(field, `The field '${field}' must be less than: ${value[0]}.`, 'maxStringLength');
        }
    }

    // noinspection TsLint
    private checkNumber(field: string): void {
        if (this.fieldIsEmpty(field)) {return;}

        if (typeof this.dataTransformed[field] !== 'number') {
            this.addError(field, `The field '${field}' must be a number.`, 'number');
        }
    }

    // noinspection TsLint
    private checkString(field: string): void {
        if (this.fieldIsEmpty(field)) {return;}

        if (typeof this.dataTransformed[field] !== 'string') {
            this.addError(field, `The field '${field}' must be a string.`, 'string');
        }
    }

    // todo add format checking
    // noinspection TsLint
    private checkDate(field: string) {
        if (this.fieldIsEmpty(field)) {return;}

        if (!this.isValidDate(this.dataTransformed[field])) {
            this.addError(field, `The field '${field}' must be a valid date format: MM/DD/YYYY.`, 'date');
        }
    }

    // noinspection TsLint
    private checkNullable(field: string): void {
        // todo some action may be
    }

    // noinspection TsLint
    private checkRegex(field: string, pattern: RegExp): void {
        if (this.fieldIsEmpty(field)) {return;}

        if (!this.dataTransformed[field]) {
            return;
        }

        const found = this.dataTransformed[field].match(pattern);
        if (!found) {
            this.addError(field, `The '${field}' format is invalid.`, 'regex');
        }
    }

    // noinspection TsLint
    private checkRequiredIfNot(field: string, dependFields: string[]): void {
        if (this.fieldIsEmpty(field)) {return;}

        for (const dependField of  dependFields) {
            if (!this.dataTransformed[dependField]) {
                if (!this.dataTransformed[field]) {
                    this.addError(field, `The field '${field}' is required when ${dependField} is empty.`, 'requiredIfNot');
                }
            }
        }
    }

    // noinspection TsLint
    private checkRequiredIf(field: string, dependFields: string[]): void {
        if (this.fieldIsEmpty(field)) {return;}

        for (const dependField of  dependFields) {
            if (this.dataTransformed[dependField]) {
                if (!this.dataTransformed[dependField]) {
                    this.addError(field, `The field '${field}' is required when '${dependField}' is not empty.`, 'requiredIf');
                }
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
