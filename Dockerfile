FROM ubuntu:latest

RUN apt-get update \
    && apt-get install -y curl git build-essential python \
    && apt-get -y autoclean
    
RUN groupadd status

RUN useradd -d /home/status -ms /bin/bash -g status -G sudo -p status status
USER status
WORKDIR /home/status

ENV NVM_VERSION v0.33.11
ENV NODE_VERSION v10.13.0
ENV NVM_DIR /home/status/.nvm
RUN mkdir $NVM_DIR
RUN curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.11/install.sh | bash

ENV NODE_PATH $NVM_DIR/v$NODE_VERSION/lib/node_modules
ENV PATH $NVM_DIR/versions/node/v$NODE_VERSION/bin:$PATH

RUN echo "source $NVM_DIR/nvm.sh && \
    nvm install $NODE_VERSION && \
    nvm alias default $NODE_VERSION && \
    nvm use default && \
    npm install -g node-gyp && \
    npm install -g embark" | bash