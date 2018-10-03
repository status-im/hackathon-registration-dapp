const { sha3 } = require('ethereumjs-util');
const merkle = require('merkle-tree-solidity');
const merkleRoot = '0x96c8e9fb478bf43f8318f07efee57abe6a68a18a5272f3faf72541d9d40f5d6f';
const elements = [
    '0x9f1ac28e80f76d8e8efb505d27f8ba4fb5e01346e93831cf84f797fcc3e9460e',
    '0x4ef2f1158e4768187b2b96c5237c9a2f9ce759dba7e38a71b1dc50c5f28dff8f',
    '0x4a5d99667f6d19d9ef1bd10297e72056d7e5abd15ff5c6ec8a0b7c5207ed3098',
    '0x194045822500d6b14288ed030e83ce30e4575b6088834e40d329a7e941683de3',
    '0xda0a712ed84148058af21cf9279e7d361bfd00b5577da5999abbdb84a9aa37f6',
    '0xf2ab923cf961b882baf26975ded9de8455424b94953a63afc6c05eab5789329a',
    '0xaa9cfa97553045e79dc59cd1735c84eb3fb44570a6140034f9790f484bdbe203',
    '0xe9d6063d3a65f26651f1f50a3ae57318ba101cdab52c0b620276220d0307f32d',
    '0x828236a898cdaf046410c315d5dd1ae850752951e352420bac97293cf97bb56e',
    '0xb4c110e5d58e713c33d9048f531f1446dec82dac9d63d360aac1bf4c51050349'
].map(x => Buffer.from(x.substring(2), 'hex'))


const merkleTree = new merkle.default(elements);
const code = "a8cd4b33bc";
const leaf = sha3(Buffer.from(code, 'hex'));
const proof = merkleTree.getProof(leaf);


















const IPFS = require('ipfs')
const OrbitDB = require('orbit-db')
const Web3 = require('web3');
const EventEmitter = require('events');

const contractAddress = "0x430655eb80f7958CC9240fe1385366DB68181C17";
const connectionURL = `ws://localhost:8546`;
const abiDefinition = [ { "constant": false, "inputs": [ { "name": "_newController", "type": "address" } ], "name": "changeController", "outputs": [], "payable": false, "stateMutability": "nonpayable", "type": "function", "signature": "0x3cebb823" }, { "constant": true, "inputs": [ { "name": "", "type": "bytes5" } ], "name": "codeUsed", "outputs": [ { "name": "", "type": "bool" } ], "payable": false, "stateMutability": "view", "type": "function", "signature": "0x723de5cd" }, { "constant": false, "inputs": [ { "name": "_proof", "type": "bytes32[]" }, { "name": "_code", "type": "bytes5" }, { "name": "_dest", "type": "address" } ], "name": "processRequest", "outputs": [], "payable": false, "stateMutability": "nonpayable", "type": "function", "signature": "0x72d209f5" }, { "constant": true, "inputs": [], "name": "sntAmount", "outputs": [ { "name": "", "type": "uint256" } ], "payable": false, "stateMutability": "view", "type": "function", "signature": "0x7f58fa14" }, { "constant": true, "inputs": [ { "name": "", "type": "address" } ], "name": "sentToAddress", "outputs": [ { "name": "", "type": "bool" } ], "payable": false, "stateMutability": "view", "type": "function", "signature": "0x81e8706d" }, { "constant": false, "inputs": [], "name": "boom", "outputs": [], "payable": false, "stateMutability": "nonpayable", "type": "function", "signature": "0xa169ce09" }, { "constant": false, "inputs": [ { "name": "_ethAmount", "type": "uint256" }, { "name": "_sntAmount", "type": "uint256" }, { "name": "_root", "type": "bytes32" } ], "name": "updateSettings", "outputs": [], "payable": false, "stateMutability": "nonpayable", "type": "function", "signature": "0xa4438334" }, { "constant": true, "inputs": [ { "name": "_proof", "type": "bytes32[]" }, { "name": "_code", "type": "bytes5" }, { "name": "_dest", "type": "address" } ], "name": "validRequest", "outputs": [ { "name": "", "type": "bool" } ], "payable": false, "stateMutability": "view", "type": "function", "signature": "0xadb187bb" }, { "constant": true, "inputs": [], "name": "SNT", "outputs": [ { "name": "", "type": "address" } ], "payable": false, "stateMutability": "view", "type": "function", "signature": "0xc55a02a0" }, { "constant": true, "inputs": [], "name": "ethAmount", "outputs": [ { "name": "", "type": "uint256" } ], "payable": false, "stateMutability": "view", "type": "function", "signature": "0xc98166c0" }, { "constant": true, "inputs": [], "name": "root", "outputs": [ { "name": "", "type": "bytes32" } ], "payable": false, "stateMutability": "view", "type": "function", "signature": "0xebf0c717" }, { "constant": true, "inputs": [], "name": "controller", "outputs": [ { "name": "", "type": "address" } ], "payable": false, "stateMutability": "view", "type": "function", "signature": "0xf77c4791" }, { "inputs": [ { "name": "_sntAddress", "type": "address" }, { "name": "_ethAmount", "type": "uint256" }, { "name": "_sntAmount", "type": "uint256" }, { "name": "_root", "type": "bytes32" } ], "payable": false, "stateMutability": "nonpayable", "type": "constructor", "signature": "constructor" }, { "anonymous": false, "inputs": [ { "indexed": false, "name": "dest", "type": "address" }, { "indexed": false, "name": "code", "type": "bytes5" }, { "indexed": false, "name": "ethAmount", "type": "uint256" }, { "indexed": false, "name": "sntAmount", "type": "uint256" } ], "name": "AddressFunded", "type": "event", "signature": "0x0aa7ecfdc9fd3f39ab380a0b6413557f94ed0dfd05ed31c925521736fa750eac" } ] ;

const events = new EventEmitter();
const ipfs = new IPFS({
    EXPERIMENTAL: {
      pubsub: true
    }
})

let orbitdb;
let web3;
let contract;

ipfs.on('ready', async () => {
    console.log("Connected to IPFS");

    orbitdb = new OrbitDB(ipfs)
    
    web3 = new Web3(new Web3.providers.WebsocketProvider(connectionURL, {headers: {Origin: "embark"}}));
    web3.eth.net.isListening()
        .then(async () => {
            console.log("Connected to WEB3: '" + connectionURL + "'");
            contract = new web3.eth.Contract(abiDefinition, contractAddress);
            const accounts = await web3.eth.getAccounts();
            web3.eth.defaultAccount = accounts[0];
            events.emit('web3:connected')
        })
        .catch(error => {
            console.error(error);
            process.exit();
        });
});


const start = async () => {
    console.log("Connecting to data stores...");
    const transactionStore = await orbitdb.keyvalue('status-hackathon-transactions2');
    await transactionStore.load()
    console.log("status-hackathon-transactions2: " + transactionStore.address.toString());
    const fundRequestStore = await orbitdb.log('status-hackathon-fund-requests2');
    await fundRequestStore.load()
    console.log("status-hackathon-fund-requests2: " + fundRequestStore.address.toString());




// =========== REMOVE THIS ========================
//const hash = await fundRequestStore.add({ address: web3.eth.defaultAccount, proof: proof.map(x => '0x' + x.toString('hex')), code });



// =========== /REMOVE THIS ========================







    let lastHashProcessed; // TODO: this might come from the db

    let running = false;
    setInterval(() => {
        if(running) return;

        console.log("Processing requests...");

        running = true;

        let conditions = {}
        if(lastHashProcessed){
            conditions = ({gt: lastHashProcessed});
        }
        
        // Query the database. 
        const records = fundRequestStore.iterator(conditions).collect();

        const all = records.map(async (e) => {
                lastHashProcessed = e.hash;
                const record = e.payload.value;

                const transaction = await transactionStore.get(record.code.toString('hex'));
                if(transaction) return;

                const validRequest =  await contract.methods.validRequest(record.proof, '0x' + record.code, record.address).call();
                if(!validRequest){
                    console.warn(record.address + "-" + record.code + " : INVALID REQUEST");
                    return;
                }
/*
                // Add code to db to indicate that we're processing it
                await transactionStore.put(record.code, record);

                // Execute the contract function
                const receipt = await contract.methods.processRequest(record.proof, record.code, record.address).send();

                // Update the db with the transaction hash
                record.transactionHash = receipt.transactionHash;
                await transactionStore.put(record.code, record);*/
            });
        
        // Wait for all promises to be resolved
        Promise.all(all).then((completed) => {
            running = false;
        });

    }, 4000);
}


events.on('web3:connected', start);
