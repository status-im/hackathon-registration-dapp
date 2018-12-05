FROM ubuntu:latest

ENV NVM_VERSION v0.33.11
ENV NODE_VERSION v10.13.0
ENV IPFS_VERSION v0.4.18

# Install ethereum + required stuff for embark
RUN apt-get update \
    && apt-get install -y curl git build-essential software-properties-common python \
    && add-apt-repository -y ppa:ethereum/ethereum \
    && apt-get install -y ethereum \
    && apt-get -y autoclean

# Installing IPFS
# TODO: move version number to variable
RUN curl https://dist.ipfs.io/go-ipfs/v0.4.18/go-ipfs_v0.4.18_linux-amd64.tar.gz --output /tmp/go-ipfs.tar.gz \
    && cd /tmp \
    && tar xvfz ./go-ipfs.tar.gz \
    && cd ./go-ipfs/ \
    && ./install.sh


# Cleanup
RUN rm -Rf /tmp/go-ipfs

# Creating user: status
RUN groupadd status
RUN useradd -d /home/status -ms /bin/bash -g status -G sudo -p status status
USER status
WORKDIR /home/status

# Initializing IPFS
RUN ipfs init

# Installing nvm
ENV NVM_DIR /home/status/.nvm
RUN mkdir $NVM_DIR
RUN curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.11/install.sh | bash

ENV NODE_PATH $NVM_DIR/v$NODE_VERSION/lib/node_modules
ENV PATH $NVM_DIR/versions/node/v$NODE_VERSION/bin:$PATH

# Installing embark
RUN echo "source $NVM_DIR/nvm.sh && \
    nvm install $NODE_VERSION && \
    nvm alias default $NODE_VERSION && \
    nvm use default && \
    npm install -g node-gyp && \
    npm install -g embark" | bash

# Installing and building registration dapp
RUN echo "source $NVM_DIR/nvm.sh && \
    git clone https://github.com/status-im/hackathon-registration-dapp.git && \
    cd hackathon-registration-dapp && \
    npm install" | bash

# TODO: create production and testnet config
# TODO: overwrite configs based on parameter
# TODO: execute codegen
# TODO: modify codegen to ask for confirmation
# TODO: execute embark build

# Help required:
# TODO: nginx config
# TODO: disable ssh? copy public keys?



