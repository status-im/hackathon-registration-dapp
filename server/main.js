const Web3 = require('web3');
const EventEmitter = require('events');
const config = require('./config');
const express = require('express');
const bodyParser = require('body-parser');
const low = require('lowdb');
const _ = require('lodash');
const FileAsync = require('lowdb/adapters/FileAsync')
const adapter = new FileAsync('db.json');
const merkleData = require('./merkle');
const { sha3 } = require('ethereumjs-util');
const merkle = require('merkle-tree-solidity');


const abiDefinition = [ { "constant": false, "inputs": [ { "name": "_newController", "type": "address" } ], "name": "changeController", "outputs": [], "payable": false, "stateMutability": "nonpayable", "type": "function", "signature": "0x3cebb823" }, { "constant": true, "inputs": [ { "name": "", "type": "bytes5" } ], "name": "codeUsed", "outputs": [ { "name": "", "type": "bool" } ], "payable": false, "stateMutability": "view", "type": "function", "signature": "0x723de5cd" }, { "constant": false, "inputs": [ { "name": "_proof", "type": "bytes32[]" }, { "name": "_code", "type": "bytes5" }, { "name": "_dest", "type": "address" } ], "name": "processRequest", "outputs": [], "payable": false, "stateMutability": "nonpayable", "type": "function", "signature": "0x72d209f5" }, { "constant": true, "inputs": [], "name": "sntAmount", "outputs": [ { "name": "", "type": "uint256" } ], "payable": false, "stateMutability": "view", "type": "function", "signature": "0x7f58fa14" }, { "constant": true, "inputs": [ { "name": "", "type": "address" } ], "name": "sentToAddress", "outputs": [ { "name": "", "type": "bool" } ], "payable": false, "stateMutability": "view", "type": "function", "signature": "0x81e8706d" }, { "constant": false, "inputs": [], "name": "boom", "outputs": [], "payable": false, "stateMutability": "nonpayable", "type": "function", "signature": "0xa169ce09" }, { "constant": false, "inputs": [ { "name": "_ethAmount", "type": "uint256" }, { "name": "_sntAmount", "type": "uint256" }, { "name": "_root", "type": "bytes32" } ], "name": "updateSettings", "outputs": [], "payable": false, "stateMutability": "nonpayable", "type": "function", "signature": "0xa4438334" }, { "constant": true, "inputs": [ { "name": "_proof", "type": "bytes32[]" }, { "name": "_code", "type": "bytes5" }, { "name": "_dest", "type": "address" } ], "name": "validRequest", "outputs": [ { "name": "", "type": "bool" } ], "payable": false, "stateMutability": "view", "type": "function", "signature": "0xadb187bb" }, { "constant": true, "inputs": [], "name": "SNT", "outputs": [ { "name": "", "type": "address" } ], "payable": false, "stateMutability": "view", "type": "function", "signature": "0xc55a02a0" }, { "constant": true, "inputs": [], "name": "ethAmount", "outputs": [ { "name": "", "type": "uint256" } ], "payable": false, "stateMutability": "view", "type": "function", "signature": "0xc98166c0" }, { "constant": true, "inputs": [], "name": "root", "outputs": [ { "name": "", "type": "bytes32" } ], "payable": false, "stateMutability": "view", "type": "function", "signature": "0xebf0c717" }, { "constant": true, "inputs": [], "name": "controller", "outputs": [ { "name": "", "type": "address" } ], "payable": false, "stateMutability": "view", "type": "function", "signature": "0xf77c4791" }, { "inputs": [ { "name": "_sntAddress", "type": "address" }, { "name": "_ethAmount", "type": "uint256" }, { "name": "_sntAmount", "type": "uint256" }, { "name": "_root", "type": "bytes32" } ], "payable": false, "stateMutability": "nonpayable", "type": "constructor", "signature": "constructor" }, { "anonymous": false, "inputs": [ { "indexed": false, "name": "dest", "type": "address" }, { "indexed": false, "name": "code", "type": "bytes5" }, { "indexed": false, "name": "ethAmount", "type": "uint256" }, { "indexed": false, "name": "sntAmount", "type": "uint256" } ], "name": "AddressFunded", "type": "event", "signature": "0x0aa7ecfdc9fd3f39ab380a0b6413557f94ed0dfd05ed31c925521736fa750eac" } ] ;

const events = new EventEmitter();

let contract;

const web3 = new Web3(new Web3.providers.WebsocketProvider(config.connectionURL, {headers: {Origin: "embark"}}));
const account = web3.eth.accounts.privateKeyToAccount(config.controllerPrivK);


web3.eth.net.isListening()
.then(async () => {

    console.log("Connected to WEB3: '" + config.connectionURL + "'");

    contract = new web3.eth.Contract(abiDefinition, config.contractAddress);
    console.log("Using account: " + account.address);

    web3.eth.accounts.wallet.add(account);
    
    events.emit('web3:connected')
})
.catch(error => {
    console.error(error);
    process.exit();
});

const asyncMiddleware = fn =>
  (req, res, next) => {
    Promise.resolve(fn(req, res, next))
      .catch(next);
  };


const isProcessing = async(code) => {
    const db = await low(adapter);
    db.defaults({transactions: {}}).write();
    const record = await db.get('transactions.' + code).value();
    return record ? true : false;
};


const process = async (request) => {
    const db = await low(adapter);

    db.defaults({transactions: {}})
      .write();

    const record = await db.get('transactions.' + request.code).value();
    if(record) {
        const message = "Transaction already exists for code: " + request.code;
        console.warn(message);
        return {"error": true, message};
    }

    const recordByAddress = _.filter(Object.values(await db.get('transactions').value()), {address: request.address});
    if(recordByAddress.length){
        const message = "Transaction already exists for address: " + request.address;
        console.warn(message);
        return {"error": true, message};
    }

    const merkleTree = new merkle.default(merkleData.elements);
    const hashedCode = sha3('0x' + request.code);   

    let proof;
    try {
        proof = merkleTree.getProof(hashedCode).map(x => "0x" + x.toString('hex'));
    } catch(error){
        const message = "Invalid Request - " + request.address + " - 0x" + request.code;
        console.warn(message);
        return {"error": true, message};
    }

    const validRequest =  await contract.methods.validRequest(proof, '0x' + request.code, request.address).call();
    if(!validRequest){
        const message = "Invalid Request - " + request.address + " - 0x" + request.code;
        console.warn(message);
        return {"error": true, message};
    }

    try {
        // Add code to db to indicate that we're processing it
        const trxRecord = {};
        trxRecord[request.code] = request;

        await db.get('transactions')
                .assign(trxRecord)
                .write();

        const gasPrice = await web3.eth.getGasPrice();

        // Execute the contract function
        const toSend = contract.methods.processRequest(proof, '0x' + request.code, request.address);

        const estimatedGas = await toSend.estimateGas({from: account.address});

        const tx = {
            gasPrice: parseInt(gasPrice),
            gas: estimatedGas + 1000,
            from: account.address,
            to: config.contractAddress,
            value: "0x00",
            data: toSend.encodeABI()
        }
                
       
        web3.eth.sendTransaction(tx)
            .on('transactionHash', async (hash) => {
                trxRecord[request.code].transactionHash = hash;
                trxRecord[request.code].transactionTimestamp = Math.floor(Date.now());
                await db.get('transactions')
                        .assign(trxRecord)
                        .write();
            
            });

        const message = "Request Processed - " + request.address + " - 0x" + request.code;
        console.log(message);
        return {message};
    } catch(err){
        console.error(err);
        // TODO: might be a good idea to notify someone?
        await db.unset('transactions.' + request.code)
                .write();

        return {"error": true, message: "Error processing transaction - Please contract a Status Core Developer"};
    }
}


events.on('web3:connected', () => {
    const app = express();
    const port = 3000;

    const router = express.Router();
    router.post('/requestFunds', asyncMiddleware(async (req, res) => {
        const request = req.body;
        if(request.code && request.address) {
            const result = await process(request);
            res.status(200)
            .send(result);
        } else {
            res.status(501)
            .send({error: "Invalid request"});
        }   
    }));

    router.get('/isProcessing/:code', asyncMiddleware(async (req, res) => {
        const params = req.params;
        const result = await isProcessing(params.code);
        res.status(200).send({result});
    }));

    app.use(function(req, res, next) {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
        next();
    });

    app.use(bodyParser.urlencoded({extended: false}));
    app.use(bodyParser.json());
    app.use('/api/', router);

    app.listen(port, () => {
        console.log('Server listening on port ' + port);
    });
});
