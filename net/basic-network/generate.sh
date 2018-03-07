#!/bin/bash
#
# Copyright IBM Corp All Rights Reserved
#
# SPDX-License-Identifier: Apache-2.0
#
# Define those global variables
if [ -f ./variables.sh ]; then
 source ./variables.sh
else
	echo_r "Cannot find the variables.sh files, pls check"
	exit 1
fi

export PATH=$GOPATH/src/github.com/hyperledger/fabric/build/bin:${PWD}/../bin:${PWD}:$PATH
export FABRIC_CFG_PATH=${PWD}
CHANNEL_NAME="${TWOFA_CHANNEL}"

# remove previous crypto material and config transactions
rm -fr config/*
rm -fr crypto-config/*

# generate crypto material
cryptogen generate --config=./crypto-config.yaml
if [ "$?" -ne 0 ]; then
  echo "Failed to generate crypto material..."
  exit 1
fi

# generate genesis block for orderer
configtxgen -profile OneOrgOrdererGenesis -outputBlock ./config/genesis.block
if [ "$?" -ne 0 ]; then
  echo "Failed to generate orderer genesis block..."
  exit 1
fi

# generate channel configuration transaction   for SERVICE_CHANNEL
configtxgen -profile OneOrgChannel -outputCreateChannelTx ./config/channel1.tx -channelID ${TWOFA_CHANNEL}
if [ "$?" -ne 0 ]; then
  echo "Failed to generate channel configuration transaction..."
  exit 1
fi

# generate anchor peer transaction   for SERVICE_CHANNEL
configtxgen -profile OneOrgChannel -outputAnchorPeersUpdate ./config/Org1MSPanchors1.tx -channelID ${TWOFA_CHANNEL} -asOrg Org1MSP
if [ "$?" -ne 0 ]; then
  echo "Failed to generate anchor peer update for Org1MSP..."
  exit 1
fi

# generate channel configuration transaction   for KAZAKTELEKOM_CHANNEL
configtxgen -profile OneOrgChannel -outputCreateChannelTx ./config/channel2.tx -channelID ${KAZTEL_CHANNEL}
if [ "$?" -ne 0 ]; then
  echo "Failed to generate channel configuration transaction..."
  exit 1
fi

# generate anchor peer transaction   for KAZAKTELEKOM_CHANNEL
configtxgen -profile OneOrgChannel -outputAnchorPeersUpdate ./config/Org1MSPanchors2.tx -channelID ${KAZTEL_CHANNEL} -asOrg Org1MSP
if [ "$?" -ne 0 ]; then
  echo "Failed to generate anchor peer update for Org1MSP..."
  exit 1
fi