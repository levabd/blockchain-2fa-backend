const regionsRu = [
    'Астана',
    'Алматы',
    'Акмолинская область',
    'Актюбинская область',
    'Алматинская область',
    'Атырауская область',
    'Восточно-Казахстанская область,',
    'Жамбылская область',
    'Западно Казахстанская область',
    'Карагандинская область',
    'Костанайская область',
    'Кзылординская область',
    'Мангистауская область',
    'Павлодарская область',
    'Северо-Казахстанская область',
    'Южно-Казахстанская область',
];

const regionsEn = [
    'Astana',
    'Almaty',
    'Akmola region',
    'Aktobe region',
    'Alma-Ata\'s region',
    'Atyrau region',
    'East Kazakhstan region,',
    'Jambyl Region',
    'West-Kazakhstan region',
    'Karaganda region',
    'Kostanay Region',
    'Kzylorda oblast',
    'Mangistau region',
    'Pavlodar region',
    'North-Kazakhstan region',
    'South-Kazakhstan oblast',
];
const regionsKz = [
    'Астана',
    'Алматы',
    'Ақмола облысы',
    'Ақтөбе облысы',
    'Алматы облысы',
    'Атырау облысы',
    'Шығыс Қазақстан облысы',
    'Жамбыл облысы',
    'Батыс Қазақстан облысы',
    'Қарағанды облысы',
    'Қостанай облысы',
    'Қызылорда облысы',
    'Маңғыстау облысы',
    'Павлодар облысы',
    'Солтүстік Қазақстан облысы',
    'Оңтүстік Қазақстан облысы',
];
// noinspection TsLint
const isEmpty = (value) => {
    return !value || value === '';
};
// noinspection TsLint
const isBoolean = (value) => {
    if (isEmpty(value)) {
        return;
    }
    return typeof (value) !== typeof (true);
};

// noinspection TsLint
const isIn = (value, list) => {
    if (isEmpty(value)) {
        return;
    }
    return list[0].split(this.RULE_VALUE_DELIMITER).indexOf(value) === -1
};

// noinspection TsLint
const isNumber = (value) => {
    if (isEmpty(value)) {
        return;
    }
    return typeof value === 'number'
};
// noinspection TsLint
const isString = (value) => {
    if (isEmpty(value)) {
        return;
    }
    return typeof value === 'string'
};

// noinspection TsLint
const isDate = (value) => {
    if (isEmpty(value)) {
        return;
    }
    return (!isValidDate(value))
};

// noinspection TsLint
const matchRegex = (value, pattern) => {
    if (isEmpty(value)) {
        return;
    }
    if (!value) {
        return;
    }

    return value.match(pattern);
};

const isValidDate = (date) => {
    var matches = /^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})$/.exec(date);
    if (matches == null) {
        return false;
    }
    var d = parseInt(matches[2], 10);
    var m = parseInt(matches[1], 10) - 1;
    var y = parseInt(matches[3], 10);
    var composedDate = new Date(y, m, d);
    return composedDate.getDate() == d &&
        composedDate.getMonth() == m &&
        composedDate.getFullYear() == y;
};

const getuserValidationErrors = (user) => {
    let errors = []
    if (isEmpty(user.Name)) {
        errors.push('Name is required')
    }

    if (!isString(user.Name)) {
        errors.push('Name must be a string')
    }

    if (!matchRegex(user.PhoneNumber, `^((\\+7|7|8)+([0-9]){10})$`)) {
        errors.push('PhoneNumber format is invalid')
    }

    if (!isString(user.Sex)) {
        errors.push('Sex must be a string')
    }

    if (!isString(user.Email)) {
        errors.push('Email must be a string')
    }

    if (!matchRegex(user.Email, `^[a-zA-Z0-9.!#$%&'*+/=?^_\`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$`)) {
        errors.push('Email format is invalid')
    }

    if (!isNumber(user.Birthdate)) {
        errors.push('Birthdate must be a number')
    }

    if (isEmpty(user.Region)) {
        errors.push('Region is required')
    }

    if (regionsEn.indexOf(user.Region) === -1
        && regionsKz.indexOf(user.Region) === -1
        && regionsRu.indexOf(user.Region) === -1) {
        errors.push('Region name is not valid. Only Kazakhstan regions are supported.')
    }

    if (isEmpty(user.PersonalAccount)) {
        errors.push('PersonalAccount is required')
    }

    if (!isNumber(user.PersonalAccount)) {
        errors.push('PersonalAccount must bu a number')
    }

    if (`${user.PersonalAccount}`.length !== 6) {
        errors.push('PersonalAccount must contains 6 numbers')
    }
    if (!isSEmpty(user.Question)) {
        errors.push('Question is required')
    }

    if (!isSEmpty(user.Answer)) {
        errors.push('Answer is required')
    }

    if (!isString(user.Question)) {
        errors.push('Question must be a string')
    }

    if (!isString(user.Answer)) {
        errors.push('Answer must be a string')
    }

    try {
        const json = JSON.parse(user.AdditionalData);
    }
    catch (e) {
        errors.push('AdditionalData must be a valid json object')

    }

    return errors;
};

const getLogValidationErrors = (user, log) => {
    let errors = []
    if (isEmpty(user.Event)) {
        errors.push('Event is required')
    }

    if (!isString(user.Event)) {
        errors.push('Name must be a string')
    }

    if (isEmpty(user.Status)) {
        errors.push('Event is required')
    }

    if (!isString(user.Status)) {
        errors.push('Status must be a string')
    }

    if (isEmpty(user.ExpiredAt)) {
        errors.push('ExpiredAt is required')
    }

    if (!isNumber(user.ExpiredAt)) {
        errors.push('ExpiredAt must be a number')
    }

    if (!isBoolean(user.Embeded)) {
        errors.push('Embeded must be a boolean')
    }

    if (isEmpty(user.ActionTime)) {
        errors.push('ActionTime is required')
    }

    if (!isNumber(user.ActionTime)) {
        errors.push('ActionTime must be a number');
    }

    return errors;
};


module.exports.isValidDate = isValidDate;
module.exports.matchRegex = matchRegex;
module.exports.isDate = isDate;
module.exports.isString = isString;
module.exports.isNumber = isNumber;
module.exports.isIn = isIn;
module.exports.isBoolean = isBoolean;
module.exports.isEmpty = isEmpty;
module.exports.getUserValidationErrors = getuserValidationErrors;
module.exports.getLogValidationErrors = getLogValidationErrors;
