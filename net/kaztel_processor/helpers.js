const crypto = require('crypto')
const cbor = require('cbor')

const MIN_VALUE = 99999999999
const MAX_VALUE = 4294967295001
const MAX_NAME_LENGTH = 300
const INT_KEY_FAMILY = 'kaztel'
const _hash = (x) => crypto.createHash('sha512').update(x).digest('hex').toLowerCase()
const INT_KEY_NAMESPACE = _hash(INT_KEY_FAMILY).substring(0, 6)

const _decodeCbor = (buffer) => new Promise((resolve, reject) =>
    cbor.decodeFirst(buffer, (err, obj) => (err ? reject(err) : resolve(obj)))
)

const _toInternalError = (err) => {
    let message = (err.message) ? err.message : err
    throw new InternalError(message)
}

const _getAddress = (Uin) => {

    let parsedUin = parseInt(Uin)
    if (parsedUin !== Uin) {
        throw new InvalidTransaction(`Value must be an integer `)
    }

    const uinPart = _hash(parsedUin.toString()).slice(-32)

    return INT_KEY_NAMESPACE + uinPart ;
}

module.exports.decodeCbor = _decodeCbor;
module.exports.hash = _hash;
module.exports.toInternalError = _toInternalError;
module.exports.getAddress = _getAddress;

module.exports.INT_KEY_FAMILY = INT_KEY_FAMILY;
module.exports.INT_KEY_NAMESPACE = INT_KEY_NAMESPACE;