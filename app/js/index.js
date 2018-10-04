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
                    start(orbitdb);
                } catch (error) {
                    this.setState({error: true, errorMessage: "Error loading the DAPP - Contact your nearest Status Core Developer"});
                    console.error(error);
                    return;
                }
            });
        });
    }

    async start(orbitdb){
        const code = location.hash.replace("#");        // QR code value, i.e.: a8cd4b33bc
        const accounts = await web3.eth.getAccounts();

        web3.eth.defaultAccount = accounts[0];

        if(!code) {
            this.setState({error: true, errorMessage: "Code is required"});
            return;
        }
        
        const merkleTree = new merkle(merkleData.elements);
        const hashedCode = sha3(code);                  // Code converted to format used on merkletree
        const proof = merkleTree.getProof(hashedCode);

        const sentToAddress =  await contract.methods.sentToAddress(web3.eth.defaultAccount).call();
        const usedCode =  await contract.methods.usedCode( '0x' + code,).call();
        const validRequest =  await contract.methods.validRequest(proof, '0x' + code, web3.eth.defaultAccount).call();

        if(sentToAddress || usedCode){
            window.location = "http://status.im"; // TODO: redirect to ENS Registration DAPP URL
        }

        if(!validRequest){
            this.setState({error: true, errorMessage: "Invalid Code"});
            return;
        }

        // Create / Open a database
        const transactionsDb = await orbitdb.keyvalue("/orbitdb/QmVL48QDwdagfGnwcasTxuGTynTxpzJbiZVgLwoiW7Cg7e/status-hackathon-transactions2");
        await transactionsDb.load();
        
        const transaction = await transactionStore.get(code);
        if(transaction){
            // TODO: show a message indicating that transaction is already being processed
        } else {
            // TODO: let's add a value to the status-fund-requests2 orbitdb log store, with a json containing the data used to invoke the validRequest contract function (all values must be strings): {code, proof: proof: proof.map(x => '0x' + x.toString('hex')), address}
            // show a message indicating that transaction is being processed        
            // /orbitdb/QmQ7dJmRiCwWGNgjDoUKX9xhdVA8vcS92R1h8S4uj1sm6v/status-hackathon-fund-requests2
        }

        // Listen for updates
        transactionsDb.events.on('replicated', (address) => {
            // TODO: trigger check
           // TODO: We'll deal here with the redirect to ENS Registration. Verify if the transaction is processed and redirect or something

        });
    
        this.setState({ready: true});
    }
  
    render(){
        // TODO: state.error == true, show message
        // TODO: state.ready == show result?
        return <h1>Hello World</h1>
    }
  }
  

ReactDOM.render(<App></App>, document.getElementById('app'));
