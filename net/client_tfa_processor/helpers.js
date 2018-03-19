const crypto = require('crypto')
const cbor = require('cbor')
const _hash = (x) => crypto.createHash('sha512').update(x).digest('hex').toLowerCase()
const INT_KEY_NAMESPACE = _hash(process.env['TRANSACTION_FAMILY_KEY']).substring(0, 6)

const _decodeCbor = (buffer) => new Promise((resolve, reject) =>
    cbor.decodeFirst(buffer, (err, obj) => (err ? reject(err) : resolve(obj)))
)

const _toInternalError = (err) => {
    let message = (err.message) ? err.message : err
    throw new InternalError(message)
}

const _getAddress = (phoneNumber) => {
    return INT_KEY_NAMESPACE +  _hash(phoneNumber.toString()).slice(-64) ;
}

module.exports.decodeCbor = _decodeCbor;
module.exports.hash = _hash;
module.exports.toInternalError = _toInternalError;
module.exports.getAddress = _getAddress;

module.exports.INT_KEY_NAMESPACE = INT_KEY_NAMESPACE;