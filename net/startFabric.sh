#!/bin/bash
#
# Copyright IBM Corp All Rights Reserved
#
# SPDX-License-Identifier: Apache-2.0
#
# Exit on first error
set -e

# Define those global variables
if [ -f ./basic-network/variables.sh ]; then
 source ./basic-network/variables.sh
else
	echo_r "Cannot find the variables.sh files, pls check"
	exit 1
fi


# don't rewrite paths for Windows Git Bash users
export MSYS_NO_PATHCONV=1

starttime=$(date +%s)

# launch network; create channel and join peer to channel
cd ./basic-network
./start.sh

TWOFA_CHAINCODE=twofa_cc
KAZTEL_CHAINCODE=kaztel_cc
CURRENT_CC_VER=1.5

#### install 2fa chaincode to SERVICE_CHANNEL ####
# peer chaincode install
docker exec -e "CORE_PEER_LOCALMSPID=Org1MSP" -e "CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp" cli peer chaincode install -n ${TWOFA_CHAINCODE} -v ${CURRENT_CC_VER} -p github.com/${TWOFA_CHAINCODE}
# peer chaincode instantiate
docker exec -e "CORE_PEER_LOCALMSPID=Org1MSP" -e "CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp" cli peer chaincode instantiate -o orderer.example.com:7050 -C ${TWOFA_CHANNEL} -n ${TWOFA_CHAINCODE} -v ${CURRENT_CC_VER} -c '{"Args":[""]}' -P "OR ('Org1MSP.member','Org2MSP.member')"
sleep 10
# peer chaincode invoke
docker exec -e "CORE_PEER_LOCALMSPID=Org1MSP" -e "CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp" cli peer chaincode invoke -o orderer.example.com:7050 -C ${TWOFA_CHANNEL} -n ${TWOFA_CHAINCODE} -c '{"function":"initLedger","Args":[""]}'


### install 2fa chaincode to KAZAKTELEKOM_CHANNEL ####
docker exec -e "CORE_PEER_LOCALMSPID=Org1MSP" -e "CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp" cli peer chaincode install -n ${KAZTEL_CHAINCODE} -v ${CURRENT_CC_VER} -p github.com/${KAZTEL_CHAINCODE}
# peer chaincode instantiate
docker exec -e "CORE_PEER_LOCALMSPID=Org1MSP" -e "CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp" cli peer chaincode instantiate -o orderer.example.com:7050 -C ${KAZTEL_CHANNEL} -n ${KAZTEL_CHAINCODE} -v ${CURRENT_CC_VER} -c '{"Args":[""]}' -P "OR ('Org1MSP.member','Org2MSP.member')"
sleep 10
# peer chaincode invoke
docker exec -e "CORE_PEER_LOCALMSPID=Org1MSP" -e "CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp" cli peer chaincode invoke -o orderer.example.com:7050 -C ${KAZTEL_CHANNEL} -n ${KAZTEL_CHAINCODE} -c '{"function":"initLedger","Args":[""]}'

printf "\nTotal setup execution time : $(($(date +%s) - starttime)) secs ...\n\n\n"
printf "Ok, you can work now\n"


# peer chaincode install -n twofachannel -v 1.0 -p github.com/twofa_cc
# peer chaincode invoke -o orderer.example.com:7050 -C twofachannel -n twofa_cc -c '{"function":"initLedger","Args":[""]}'