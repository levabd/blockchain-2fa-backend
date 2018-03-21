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
    url: 'http://127.0.0.1:8008/state/cd242ec4e96d1849969b050993a4e4ec0410c8d967b86f431a94a511e6944055d15dec',
    headers: {'Content-Type': 'application/octet-stream'}
}, (err, response) => {
    if (err) return console.log(err)

    var dataBase64 = JSON.parse(response.body).data

    console.log(cbor.decode(new Buffer(dataBase64, 'base64')));
});
//.




