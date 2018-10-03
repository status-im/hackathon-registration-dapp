# hackathon-registration-dapp


TODO - Add docs


### Installation:

```
git clone https://github.com/status-im/hackathon-registration-dapp.git
cd hackathon-registration-dapp
npm install
```

### Setup
1. Edit config/blockchain.js and set the address and password that will be used as the controller of the contract
2. Edit server/config.js, and set the SNTGiveaway contract address, and the controller address


### Generating codes
To generate the codes, `node server/codegen.js` will generate a `codes.txt` file, and the proof and merkle root used for the contract

### Running the dapp.
```
embark run
```


