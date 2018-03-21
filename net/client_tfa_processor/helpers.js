const crypto = require('crypto')
const cbor = require('cbor')
const _hash = (x) => crypto.createHash('sha512').update(x).digest('hex').toLowerCase()
const INT_KEY_NAMESPACE = _hash(process.env['TRANSACTION_FAMILY_KEY']).substring(0, 6)
const CRC16 = require('crc16');

const _decodeCbor = (buffer) => new Promise((resolve, reject) =>
    cbor.decodeFirst(buffer, (err, obj) => (err ? reject(err) : resolve(obj)))
)

const _toInternalError = (err) => {
    let message = (err.message) ? err.message : err
    throw new InternalError(message)
}

const _getAddress = (phoneNumber) => {
    return INT_KEY_NAMESPACE + _hash(phoneNumber.toString()).slice(-64);
}

const hexdec = (hexString) => {
    hexString = (hexString + '').replace(/[^a-f0-9]/gi, '')
    return parseInt(hexString, 16)
}

const _generate =(str)=>{
    const code = hexdec(CRC16(str))
    if (`${code }`.length!==6){
        return _generate(`${str}::${Math.random()}` )
    }
    return code
}

const sortNumber = (a, b) => {
    return a - b;
}

const _getLatestIndex = (indexes) => {
    indexes.sort(sortNumber);
    return indexes[indexes.length - 1]
}

module.exports.decodeCbor = _decodeCbor;
module.exports.hash = _hash;
module.exports.generateCode = _generate;
module.exports.toInternalError = _toInternalError;
module.exports.getAddress = _getAddress;
module.exports.getLatestIndex = _getLatestIndex;

module.exports.INT_KEY_NAMESPACE = INT_KEY_NAMESPACE;