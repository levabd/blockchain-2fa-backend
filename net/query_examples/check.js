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

console.log('length');

request.get({
    url: 'http://127.0.0.1:8008/blocks?limit=1000&min=200',
    headers: {'Content-Type': 'application/octet-stream'}
}, (err, response) => {
    if (err) return console.log(err)

    var dataBase64 = JSON.parse(response.body).data

    console.log('length', dataBase64.length);
});
//.




