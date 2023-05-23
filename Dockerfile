FROM node:18-alpine AS builder
ARG NPM_TOKEN

# Create app directory
WORKDIR /app

COPY . .

RUN apk update && apk add git
RUN echo "registry=https://registry.npmjs.org/" >> .npmrc && \
  echo "@yolominds:registry=https://npm.pkg.github.com/" >> .npmrc && \
  echo "//npm.pkg.github.com/:_authToken=$NPM_TOKEN" >> .npmrc && \
  yarn install && \
  rm -f .npmrc

ENV ENVIRONMENT=dev
ENV NETWORK=goerli

RUN yarn workspace seacows-amm run prepare:${ENVIRONMENT}:${NETWORK}
RUN yarn workspace seacows-amm run build

FROM node:18-alpine
WORKDIR /app

COPY --from=builder /app/node_modules /app/node_modules
COPY --from=builder /app/packages /app/packages
COPY --from=builder /app/package.json /app/package.json

# CMD ["yarn", "workspace", "seacows-amm", "run", "deploy:$ENVIRONMENT:$NETWORK"]
CMD ["sh", "-c", "yarn workspace seacows-amm run deploy:${ENVIRONMENT}:${NETWORK} --version-label 1.0.0"]