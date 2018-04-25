import * as crypto from 'crypto';

export const hash = (x) => crypto.createHash('sha512').update(x).digest('hex').toLowerCase();

export const sortNumber = (a, b) => {
    return a - b;
};

export const getLatestIndex = (indexes) => {
    indexes.sort(sortNumber);
    return indexes[indexes.length - 1];
};

export const getRandomInt = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

export const genCode = () => {
    return getRandomInt(9999, 99999);
};

export const decimalToHexString = (number) => {
    if (number < 0) {
        number = 0xFFFFFFFF + number + 1;
    }

    return number.toString(16).toLowerCase();
};

export const md5 = (contents: string) => {
    return crypto.createHash('md5').update(contents).digest('hex');
};