const crypto = require('crypto')

export const _hash = (x) => crypto.createHash('sha512').update(x).digest('hex').toLowerCase()

export const LOG_STATUSES = {
    SEND_CODE: 'SEND_CODE',
    RESEND_CODE: 'RESEND_CODE',
    INVALID: 'INVALID',
    VALID: 'VALID',
    EXPIRED: 'EXPIRED',
}

export const sortNumber = (a, b) => {
    return a - b;
}

export const _getLatestIndex = (indexes) => {
    indexes.sort(sortNumber);
    return indexes[indexes.length - 1];
}