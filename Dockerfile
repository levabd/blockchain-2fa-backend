FROM node:carbon

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

RUN npm install
# If you are building your code for production
# RUN npm install --only=production

# Bundle app source
COPY . .
RUN npm run build

ENV PORT=3000 NODE_ENV=local
ENV APP_PATH=/home/peshkov/dev/blockchain/hyperledger/blockchain-2fa-backend
ENV LOG_PATH=/home/peshkov/dev/blockchain/hyperledger/blockchain-2fa-backend/logs
ENV API_KEY=xg74JjM1j5200vK

ENV BYPASS_QUEUE=1

ENV PEER_HOST=0.0.0.0
ENV ORDERER_HOST=0.0.0.0

ENV PUSHER_KEY=7f9e4cad48898a8af3fe
ENV PUSHER_APP_ID=481476
ENV PUSHER_SECRET=64044cf32950917ad76c
ENV PUSHER_CLUSTER=eu

ENV REDIS_HOST=0.0.0.0
ENV REDIS_PORT=6379

ENV SMS_USERNAME=2authorization
ENV SMS_PASSWORD=sHg0IBRFrd4j7Pc
ENV SMS_CALLBACK_TOKEN=r6eRWSC8UgWb
ENV KAZAHTELECOM_KEY=52d4f2d54f254
ENV TWOFA_CHANNEL=twofachannel
ENV TWOFA_CHAINCODE=twofa_cc
ENV KAZTEL_CHANNEL=kaztelchannel
ENV KAZTEL__CHAINCODE=kaztel_cc
ENV GOOGLE_API_KEY=AIzaSyDR4G506UdebphK1mnMxv4eqTDpu_5JuiY
ENV FIREBASE_CLOUD_KEY=AAAANnj9ZGc:APA91bGkV3mkrIUZb6eK6rTGcN66edPymuMp5N3W0ebY9F0DdnOLfghhTFh44YYwe8YuaBMsEzBWoA-LHIwSgT6F6TpOkW2UB$
ENV FIREBASE_CLOUD_ID=233958106215
ENV TFA_FAMILY_NAME=tfa
ENV TFA_FAMILY_VERSION=0.1
ENV KAZTEL_FAMILY_NAME=kaztel
ENV KAZTEL_FAMILY_VERSION=0.1
ENV EGOV_FAMILY_NAME=egov
ENV EGOV_FAMILY_VERSION=0.1
ENV VALIDATOR_REST_API=http://172.18.0.2:8008

EXPOSE 3000
CMD [ "npm", "run", "start" ]
