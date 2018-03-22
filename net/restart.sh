#!/usr/bin/env bash
cd ..
./run.sh

cd net
cd ./service_tfa_processor
docker build -t allatrack/s_tfa_tp .

cd ..
cd ./client_tfa_processor
docker build -t allatrack/sc_tfa_tp .

cd ..
docker rm -f $(docker ps -aq) && yes | docker network prune && docker-compose -f network.yaml up -d
