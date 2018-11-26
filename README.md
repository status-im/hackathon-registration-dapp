# hackathon-registration-dapp

### Prerequisites:
- Geth, IPFS and Embark installed

### Installation:

```
git clone https://github.com/status-im/hackathon-registration-dapp.git
cd hackathon-registration-dapp
npm install
```
### Configuring dapp
Edit `./app/js/config.js`. Edit the ens-usernames dApp URL, and the API endpoint
*NOTE*: The server caches the .js/.css files, so in order to see the new changes, edit `./app/index.html` to point to a new version of the files, and edit `./embark.json` so the files are generated with a new name. Then, `embark build testnet/livenet` after changes.

### Background service
A nodejs service was created to receive funding requests. It requires a geth light node to run
0. `chmod 600 server/config.js`
1. Edit `server/config.js` and set the contract address and the private key of the controller address.
2. `node server/main.js`

### Running the dapp in a development environment
0. `embark run`
1. Browse  http://localhost:8000/index.htm?CODE_TO_REDEEM

### Generating codes (IN DEV)
To generate the codes, execute `node server/codegen.js`. This comand will output a `.\codes.txt` file, and the proof and merkle root used for the contract in `server/merkle.js`




