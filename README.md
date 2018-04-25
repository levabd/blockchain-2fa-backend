<center>

![](https://cdn-images-1.medium.com/max/1200/1*2646BxDq2ICh_oNFPolAXQ.jpeg)

# [2FA Hyperledger Typescript Project](https://medium.com/wearetheledger/hyperledger-fabric-typescript-boilerplate-455004d0c6c8)

[![Build Status](https://travis-ci.org/wearetheledger/hyperledger-typescript-boilerplate.svg?branch=master)](https://travis-ci.org/wearetheledger/hyperledger-typescript-boilerplate)

</center>

### This is a starter template that interacts between Hyperledger Fabric Peers and a front end. Currently, this boilerplate provides the following features:

- Express backend built with typescript using [Nest](https://github.com/kamilmysliwiec/nest) 
- Restful routing to connect a custom frontend
- Automatic OpenAPI (Swagger) generation
- Solves Hyperledger [concurrency issues](https://medium.com/wearetheledger/hyperledger-fabric-concurrency-really-eccd901e4040) by using a FIFO AWS SQS queue.

## Installation
Install dependencies

`npm i`

## Starting the app

`npm start`

## E2E Tests using Jest (wip)

`npm test`





