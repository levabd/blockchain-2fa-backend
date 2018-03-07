#!/bin/bash
#
# Copyright IBM Corp All Rights Reserved
#
# SPDX-License-Identifier: Apache-2.0
#
# Exit on first error, print all commands.
set -ev

# Define those global variables
if [ -f ./variables.sh ]; then
 source ./variables.sh
else
	echo_r "Cannot find the variables.sh files, pls check"
	exit 1
fi

# don't rewrite paths for Windows Git Bash users
export MSYS_NO_PATHCONV=1

docker rm -f $(docker ps -aq) && yes | docker network prune
sleep 2
docker-compose -f docker-compose.yml down

docker-compose -f docker-compose.yml up -d ca.example.com orderer.example.com peer0.org1.example.com couchdb cli redis

# wait for Hyperledger Fabric to start
# incase of errors when running later commands, issue export FABRIC_START_TIMEOUT=<larger number>
export FABRIC_START_TIMEOUT=10
#echo ${FABRIC_START_TIMEOUT}
sleep ${FABRIC_START_TIMEOUT}

# Create the channel SERVICE_CHANNEL
docker exec -e "CORE_PEER_LOCALMSPID=Org1MSP" -e "CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/msp/users/Admin@org1.example.com/msp" peer0.org1.example.com peer channel create -o orderer.example.com:7050 -c ${TWOFA_CHANNEL} -f /etc/hyperledger/configtx/channel1.tx
# Join peer0.org1.example.com to the channel.SERVICE_CHANNEL
docker exec -e "CORE_PEER_LOCALMSPID=Org1MSP" -e "CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/msp/users/Admin@org1.example.com/msp" peer0.org1.example.com peer channel join -b ${TWOFA_CHANNEL}.block

# Create the channel KAZAKTELEKOM_CHANNEL
docker exec -e "CORE_PEER_LOCALMSPID=Org1MSP" -e "CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/msp/users/Admin@org1.example.com/msp" peer0.org1.example.com peer channel create -o orderer.example.com:7050 -c ${KAZTEL_CHANNEL} -f /etc/hyperledger/configtx/channel2.tx
# Join peer0.org1.example.com to the channel.KAZAKTELEKOM_CHANNEL
docker exec -e "CORE_PEER_LOCALMSPID=Org1MSP" -e "CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/msp/users/Admin@org1.example.com/msp" peer0.org1.example.com peer channel join -b ${KAZTEL_CHANNEL}.block

