import * as  changeCase from 'change-case';

const DICT = {
    en: {
        required: 'The field :field is required.',
        number: 'The field :field must be a number.',
        string: 'The field :field must be a string.',
        boolean: 'The field :field must be a boolean.',
        in: 'The field :field must be one of the: :list.',
        maxStringLength: 'The field :field must be less than: :value.',
        maxNumberLength: 'The length of field :field must be less than: :value.',
        maxNumber: 'The field :field must be less than: :value.',
        date: 'The field :field must be a valid date format.',
        regex: 'The :field format is invalid.',
        requiredIf: 'The field :field is required when :dependField is not empty.',
        requiredIfNot: 'The field :field is required when :dependField is empty.',
    },
    ru: {
        required: 'Поле :field обязательно для заполнения.',
        number: 'Поле :field должно быть числом.',
        string: 'Поле :field должно быть строкой.',
        boolean: 'Поле :field должно быть true или false.',
        in: 'Поле :field должно входить в список: :list.',
        maxStringLength: 'Поле :field должно содерджать :value символов.',
        maxNumberLength: 'Число :field должно быть меньше :value.',
        maxNumber: 'Число :field должно быть меньше :value.',
        date: 'Неверный формат даты.',
        regex: 'Поле :field неверного формата.',
        requiredIf: 'Поле :field обязательно, если не пустое поле :dependField.',
        requiredIfNot: 'Поле :field обязательно, если пустое поле :dependField.',
    },
};

const FIELD_LIST_DICT = {
    ru: {
        phone_number: `'Номер телефона'`,
        index: `'Индекс'`,
        event: `'Событие'`,
        service: `''Сервис`,
        push_token: `'Пуш токен'`,
        embeded: `'Встроенное устройство'`,
        client_timestamp: `'Дата и время клиента'`,
        cert: `'Сертификат'`,
        name: `'Имя'`,
        uin: `'ИИН'`,
        code: `'Код'`,
        sex: `'Пол'`,
        email: `'Электронная почта'`,
        birthdate: `'День рождения'`,
        Region: `'Регион'`,
        personal_account: `'Лицевой счет'`,
        question: `'Вопрос'`,
        answer: `'Ответ'`,
        additional_data: `'Дополнительная информация'`,
        region: `'Регион'`,
        method: `'Метод'`,
    },
    en: {
        phone_number: `'Phone number'`,
        index: `'Index'`,
        event: `'Event'`,
        service: `''Service`,
        push_token: `'Push token'`,
        embeded: `'Embeded'`,
        client_timestamp: `'Client timestamp'`,
        cert: `'Certificate'`,
        name: `'Name'`,
        uin: `'Uin'`,
        code: `'Code'`,
        sex: `'Sex'`,
        email: `'Email'`,
        birthdate: `'Birthdate'`,
        Region: `'Region'`,
        personal_account: `'Personal account'`,
        question: `'Question'`,
        answer: `'Answer'`,
        additional_data: `'Additional data'`,
        method: `'Method'`,
        region: `'Region'`,
        remember: `'Remember'`,
    },
};

/***
 * Validator class
 */
export class Validator {

    private errors = {};
    private dataTransformed = {};
    private RULE_VALUE_DELIMITER = ',';
    private RULE_VERSUS_VALUE_DELIMITER = ':';
    private lang = 'en';
    private RULES_DELIMITER = '|';

    constructor(private data?: any, private rules?: any, private messages?: any) {
        const fieldsToHandle = Object.keys(this.data);
        for (let f of fieldsToHandle) {
            this.dataTransformed[changeCase.snakeCase(f)] = this.data[f];
        }

        if (['ru', 'en'].indexOf(this.data.lang) !== -1) {
            this.lang = this.data.lang || 'en';
        } else {
            this.lang = 'en';
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
                            console.info(`Validator@constructor: validation error funcName `, funcName, fieldNameToCheck);
                        }
                        continue;
                    }

                    // required. number, string, nullable
                    this['check' + this.capitalizeFirstLetter(splitted[0])](fieldNameToCheck);

                } catch (e) {
                    console.info(`Validator@constructor: validation type is not supported`, e);
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

    addError(fieldName: string, checkType?: string, data?: any): void {
        if (!this.errors[fieldName]) {
            this.errors[fieldName] = [];
        }

        let checkMessage;
        if (checkType && this.messages) {
            checkMessage = this.messages[`${fieldName}.${checkType}`];
        }

        this.errors[fieldName].push(checkMessage || this.getMessage(checkType, data));
    }

    // noinspection TsLint
    private checkRequired(field: string): void {
        if (!this.dataTransformed[field] || this.dataTransformed[field] === '') {
            this.addError(field, 'required', {field: field});
        }
    }

    // noinspection TsLint
    private checkBoolean(field: string): void {
        if (this.fieldIsEmpty(field)) {
            return;
        }

        if (typeof(this.dataTransformed[field]) !== typeof(true)) {
            this.addError(field, 'boolean', {field: field});
        }
    }

    private fieldIsEmpty(field: string): boolean {
        return this.dataTransformed[field] === undefined || this.dataTransformed[field] === '';
    }

    // noinspection TsLint
    private checkIn(field: string, list: string): void {
        if (this.fieldIsEmpty(field)) {
            return;
        }

        if (list[0].split(this.RULE_VALUE_DELIMITER).indexOf(this.dataTransformed[field]) === -1) {
            this.addError(field, 'in', {field: field, list: list});
        }
    }

    // noinspection TsLint
    private checkMaxStringLength(field: string, value: string): void {
        if (this.fieldIsEmpty(field)) {
            return;
        }

        if (this.dataTransformed[field].length >= parseInt(value, 10)) {
            this.addError(field, 'maxStringLength', {field: field, value: value});
        }
    }

    // noinspection TsLint
    private checkMaxNumber(field: string, value: string): void {
        if (this.fieldIsEmpty(field)) {
            return;
        }

        if (parseInt(this.dataTransformed[field], 10) >= parseInt(value[0], 10)) {
            this.addError(field, 'maxNumber', {field: field, value: value});
        }
    }

    // noinspection TsLint
    private checkMaxNumberLength(field: string, value: string): void {
        if (this.fieldIsEmpty(field)) {
            return;
        }

        if (`${this.dataTransformed[field]}`.length >= parseInt(value[0], 10)) {
            this.addError(field, 'maxNumberLength', {field: field, value: value});
        }
    }

    // noinspection TsLint
    private checkNumber(field: string): void {
        if (this.fieldIsEmpty(field)) {
            return;
        }

        try {
            let pn = parseInt(this.dataTransformed[field], 10);

            if (typeof pn !== 'number' || typeof this.dataTransformed[field] !== 'number') {
                this.addError(field, 'number', {field: field});
            }
            return;
        } catch (e) {
            console.log('not number passed to request');
            this.addError(field, 'number', {field: field});
            return;
        }


    }

    // noinspection TsLint
    private checkString(field: string): void {
        if (this.fieldIsEmpty(field)) {
            return;
        }

        if (typeof this.dataTransformed[field] !== 'string') {
            this.addError(field, 'string', {field: field});
        }
    }

    // todo add format checking
    // noinspection TsLint
    private checkDate(field: string) {
        if (this.fieldIsEmpty(field)) {
            return;
        }

        if (!this.isValidDate(this.dataTransformed[field])) {
            this.addError(field, 'date', {field: field});
        }
    }

    // noinspection TsLint
    private checkNullable(field: string): void {
        // todo some action may be
    }

    // noinspection TsLint
    private checkRegex(field: string, pattern: RegExp): void {
        if (this.fieldIsEmpty(field)) {
            return;
        }

        if (!this.dataTransformed[field]) {
            return;
        }

        const found = this.dataTransformed[field].match(pattern);
        if (!found) {
            this.addError(field, 'regex', {field: field});
        }
    }

    // noinspection TsLint
    private checkRequiredIfNot(field: string, dependFields: string[]): void {
        if (this.fieldIsEmpty(field)) {
            return;
        }

        for (const dependField of  dependFields) {
            if (!this.dataTransformed[dependField]) {
                if (!this.dataTransformed[field]) {
                    this.addError(field, 'requiredIfNot', {field: field, dependField: dependField});
                }
            }
        }
    }

    // noinspection TsLint
    private checkRequiredIf(field: string, dependFields: string[]): void {
        if (this.fieldIsEmpty(field)) {
            return;
        }

        for (const dependField of  dependFields) {
            if (this.dataTransformed[dependField]) {
                if (!this.dataTransformed[dependField]) {
                    this.addError(field, 'requiredIf', {field: field, dependField: dependField});
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

    /**
     * get message from dictionary
     *
     * @param {string | undefined} checkType
     * @param data
     * @returns {string}
     */
    private getMessage(checkType: string | undefined, data: any): string {
        console.log('checkType', checkType);
        let letter = DICT[this.lang || 'en'][checkType];

        Object.keys(data).forEach(key => {
            try {
                letter = letter.replace(`:${key}`, key === 'list' ? data[key] : FIELD_LIST_DICT[this.lang || 'en'][data.field]);
            } catch (e) {
                console.log('Error while parsing error message', e);
            }
        });
        return letter;
    }
}
