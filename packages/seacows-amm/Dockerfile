FROM node:18-alpine AS builder

# Create app directory
WORKDIR /app

COPY yarn.lock ./yarn.lock
COPY package.json ./package.json

# Install yarn
RUN yarn install

ENV ENVIRONMENT=dev
ENV NETWORK=goerli

RUN yarn prepare ${ENVIRONMENT} ${NETWORK}
RUN yarn build
RUN yarn deploy ${ENVIRONMENT} ${NETWORK}

CMD ["yarn", "deploy:dev", "${ENVIRONMENT}", "${NETWORK}"]