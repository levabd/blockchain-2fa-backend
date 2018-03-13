const {createContext, CryptoFactory} = require('sawtooth-sdk/signing')

const context = createContext('secp256k1')
const privateKey = context.newRandomPrivateKey()
const signer = new CryptoFactory(context).newSigner(privateKey)
const cbor = require('cbor')
const protobuf = require('protobufjs')

const atob = require('atob');
const btoa = require('btoa');
const {
    InternalError
} = require('sawtooth-sdk/processor/exceptions')

const request = require('request')
const encode = obj => Buffer.from(JSON.stringify(obj, Object.keys(obj).sort()))
const decode = buf => JSON.parse(buf.toString())

request.get({
    url: 'http://127.0.0.1:8008/state/5f1db9a2994afba4dc92ff982ed1e9c269416affbefef4e8a13b3dbbdcd2dbfe5a9e38',
    headers: {'Content-Type': 'application/octet-stream'}
}, (err, response) => {
    if (err) return console.log(err)

    var dataBase64 = JSON.parse(response.body).data
    console.log(dataBase64);

    console.log(cbor.decode(new Buffer(dataBase64, 'base64')));
});

request.get({
    url: 'http://127.0.0.1:8008/transactions',
    headers: {'Content-Type': 'application/octet-stream'}
}, (err, response) => {
    if (err) return console.log(err)

    var dataBase64 = JSON.parse(response.body).data[0].payload

    console.log(cbor.decode(new Buffer(dataBase64, 'base64')));
});




