const crypto = require('crypto')
const cbor = require('cbor')

const MIN_VALUE = 99999999999
const MAX_VALUE = 4294967295001
const MAX_NAME_LENGTH = 300
const INT_KEY_FAMILY = 'tfa'
const _hash = (x) => crypto.createHash('sha512').update(x).digest('hex').toLowerCase()
const INT_KEY_NAMESPACE = _hash(INT_KEY_FAMILY).substring(0, 6)

const _decodeCbor = (buffer) => new Promise((resolve, reject) =>
    cbor.decodeFirst(buffer, (err, obj) => (err ? reject(err) : resolve(obj)))
)

const _toInternalError = (err) => {
    let message = (err.message) ? err.message : err
    throw new InternalError(message)
}

const _getAddress = (PhoneNumber) => {
    const phoneNumberPart = _hash(PhoneNumber.toString()).slice(-64)
    return INT_KEY_NAMESPACE + uinPart + phoneNumberPart;
}

module.exports.decodeCbor = _decodeCbor;
module.exports.hash = _hash;
module.exports.toInternalError = _toInternalError;
module.exports.getAddress = _getAddress;

module.exports.INT_KEY_FAMILY = INT_KEY_FAMILY;
module.exports.INT_KEY_NAMESPACE = INT_KEY_NAMESPACE;