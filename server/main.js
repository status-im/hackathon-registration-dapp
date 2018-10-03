const IPFS = require('ipfs')
const OrbitDB = require('orbit-db')
const Web3 = require('web3');
const EventEmitter = require('events');

const contractAddress = "0xA49e638dD086E38Dac737C9346909f62DDf7d387";
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
    const transactionStore = await orbitdb.keyvalue('status-hackathon-transactions');
    console.log("status-hackathon-transactions: " + transactionStore.address.toString());

    const fundRequestStore = await orbitdb.log('status-hackathon-fund-requests');
    console.log("status-hackathon-fund-requests: " + fundRequestStore.address.toString());

    let lastCodeProcessed;

    let running = false;
    setInterval(() => {
        if(running) return;

        console.log("Processing requests...");

        running = true;

        let conditions = {}
        if(lastCodeProcessed){
            conditions = ({gt: lastCodeProcessed});
        }

        // Query the database. 
        const all = fundRequestStore.iterator(conditions)
            .collect()
            .map(async (e) => {
                const record = e.payload.value;

                lastCodeProcessed = record.code;

                const transaction = transactionStore.get(record.code);
                if(!transaction) return;

                const validRequest =  await contract.methods.validRequest(record.proof, record.code, record.address).call();
                if(!validRequest){
                    console.warn(record.address + "-" + record.code + " : INVALID REQUEST");
                    return;
                }

                // Add code to db to indicate that we're processing it
                await transactionStore.put(record.code, record);

                // Execute the contract function
                const receipt = await contract.methods.processRequest(record.proof, record.code, record.address).send();

                // Update the db with the transaction hash
                record.transactionHash = receipt.transactionHash;
                await transactionStore.put(record.code, record);
            });
        
        // Wait for all promises to be resolved
        Promise.all(all).then((completed) => {
            running = false;
        });

    }, 20000);
}


events.on('web3:connected', start);
