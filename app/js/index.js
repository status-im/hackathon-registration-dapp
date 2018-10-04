import React, { Fragment } from 'react';
import ReactDOM from 'react-dom';
import EmbarkJS from 'Embark/EmbarkJS';
import web3 from 'Embark/web3'
import merkleData from './merkle';
import { sha3 } from 'ethereumjs-util';
import merkle from 'merkle-tree-solidity';
import SNTGiveaway from 'Embark/contracts/SNTGiveaway';
import SNT from 'Embark/contracts/SNT';
import IPFS from 'ipfs';
import OrbitDB from 'orbit-db';
import { start } from 'ipfs/src/core/components';

const ipfsOptions = {
    EXPERIMENTAL: {
      pubsub: true
    }
};

window.SNTGiveaway = SNTGiveaway;
window.SNT = SNT;

class App extends React.Component {

    constructor(props) {
      super(props);
      this.state = {
        error: false,
        errorMessage: '',
        ready: false
      };
    }

    componentDidMount(){
        EmbarkJS.onReady(async (error) => {
            
            if(error){
                this.setState({error: true, errorMessage: "Error loading the DAPP - Contact your nearest Status Core Developer"});
                console.error(error);
                return;
            }

            const ipfs = new IPFS(ipfsOptions)

            ipfs.on('error', (e) => {
                this.setState({error: true, errorMessage: "Error loading the DAPP - Contact your nearest Status Core Developer"});
                console.error(e);
            });

            ipfs.on('ready', async () => {
                try {
                    const orbitdb = new OrbitDB(ipfs);
                    await this.start(orbitdb);
                } catch (error) {
                    this.setState({error: true, errorMessage: "Error loading the DAPP - Contact your nearest Status Core Developer"});
                    console.error(error);
                    return;
                }
            });
        });
    }

    async redirectIfProcessed(code){
        const sentToAddress =  await SNTGiveaway.methods.sentToAddress(web3.eth.defaultAccount).call();
        const usedCode =  await SNTGiveaway.methods.codeUsed( '0x' + code,).call();
        if(sentToAddress || usedCode){
            window.location = "http://status.im"; // TODO: redirect to ENS Registration DAPP URL
        }
    }

    async start(orbitdb){
        const code = location.hash.replace("#", '');        // QR code value, i.e.: a8cd4b33bc
        const accounts = await web3.eth.getAccounts();

        web3.eth.defaultAccount = accounts[0];

        if(!code) {
            this.setState({error: true, errorMessage: "Code is required"});
            return;
        }
        const merkleTree = new merkle(merkleData.elements);
        const hashedCode = sha3('0x' + code);   

        let proof;
        try {
            proof = merkleTree.getProof(hashedCode);
        } catch(error){
            this.setState({error: true, errorMessage: "Invalid Code"});
            console.log(error);
            return;
        }

        this.redirectIfProcessed(code);

        const validRequest = await SNTGiveaway.methods.validRequest(proof, '0x' + code, web3.eth.defaultAccount).call();
        if(!validRequest){
            this.setState({error: true, errorMessage: "Invalid Code"});
            console.error("Code not found in contract's merkle root");
            return;
        }

        // Create / Open a database
        const transactionsDb = await orbitdb.keyvalue("/orbitdb/QmVL48QDwdagfGnwcasTxuGTynTxpzJbiZVgLwoiW7Cg7e/status-hackathon-transactions2");
        await transactionsDb.load();
        
        const transaction = await transactionsDb.get(code);
        if(!transaction){
            const fundRequestsDB = await orbitdb.log("/orbitdb/QmQ7dJmRiCwWGNgjDoUKX9xhdVA8vcS92R1h8S4uj1sm6v/status-hackathon-fund-requests2");
            await fundRequestsDB.load();

            const record = {
                code,
                address: web3.eth.defaultAccount,
                proof: proof.map(x => '0x' + x.toString('hex'))
            }

            const hash = await fundRequestsDB.add(record)

            console.log(hash);

            // TODO: avoid people spamming with localstorage
        }

        // Listen for updates
        transactionsDb.events.on('replicated', (address) => {
            this.redirectIfProcessed(code);
        });


        this.setState({ready: true});
    }
  
    render(){
        const {error, errorMessage, ready} = this.state;

        return <Fragment>
            { error && <h2>{errorMessage}</h2> }

            { !ready && !error && <h2>Add a loading message / indicator that the dapp is checking whether the code is valid or not </h2> }
            
            { ready && <h2>Add a message indicating that the code has been received, and we're processing the trx</h2> }
        </Fragment>
    }
  }
  

ReactDOM.render(<App></App>, document.getElementById('app'));
