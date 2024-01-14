FROM node:20-slim

ENV WORKDIR=/app
ENV MODULES_DIR=/modules

WORKDIR $MODULES_DIR
COPY package.json $MODULES_DIR

RUN npm install -g pnpm && \
    pnpm config set auto-install-peers true && \
    pnpm config set shamefully-hoist true && \
    pnpm install

ENV PATH=$MODULES_DIR/node_modules/.bin:$PATH

WORKDIR $WORKDIR
COPY . .