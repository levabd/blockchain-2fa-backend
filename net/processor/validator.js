
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
    if (isEmpty (value)) {
        return;
    }
    return typeof value === 'number'
};
// noinspection TsLint
const isString = (value) => {
    if (isEmpty (value)) {
        return;
    }
    return typeof value === 'string'
};

// noinspection TsLint
const isDate = (value) => {
    if (isEmpty (value)) {
        return;
    }
    return (!isValidDate(value))
};

// noinspection TsLint
const matchRegex = (value, pattern) => {
    if (isEmpty (value)) {
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
    let errors= []
    if (isEmpty(user.Name)){
        errors.push('User name is required')
    }

    if (!isString(user.Name)){
        errors.push('User name must be a string')
    }

    if (!matchRegex(user.PhoneNumber, `^((\\+7|7|8)+([0-9]){10})$`)){
        errors.push('PhoneNumber format is invalid')
    }

    if (!isString(user.Sex)){
        errors.push('User sex must be a string')
    }

    if (!isString(user.Email)){
        errors.push('User email must be a string')
    }

    if (!matchRegex(user.Email, `^[a-zA-Z0-9.!#$%&'*+/=?^_\`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$`)){
        errors.push('User email address format is invalid')
    }

    if (!isNumber(user.Birthdate)){
        errors.push('User Birthdate must be a number')
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
module.exports.getuserValidationErrors = getuserValidationErrors;
