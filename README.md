# hackathon-registration-dapp


TODO - Add docs


### Installation:

```
git clone https://github.com/status-im/hackathon-registration-dapp.git
cd hackathon-registration-dapp
npm install
```

### Contracts
TODO

Send enough SNT/ETH to the contract address. These funds are going to be distributed.

### Generating codes
To generate the codes, execute `node server/codegen.js`. This comand will output a `codes.txt` file, and the proof and merkle root used for the contract

### Background service
A nodejs service was created to receive funding requests. It requires a geth light node to run
0. `chmod 600 server/config.js`
1. Edit `server/config.js` and set the contract address and the private key of the controller address.
2. `npm start`

### Running the dapp.
0. `embark run`
1. Browse  http://localhost:8000/index.htm?CODE_TO_REDEEM



