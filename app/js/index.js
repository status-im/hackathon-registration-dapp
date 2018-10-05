import React, { Fragment } from 'react';
import ReactDOM from 'react-dom';
import EmbarkJS from 'Embark/EmbarkJS';
import web3 from 'Embark/web3'
import merkleData from './merkle';
import { sha3 } from 'ethereumjs-util';
import merkle from 'merkle-tree-solidity';
import SNTGiveaway from 'Embark/contracts/SNTGiveaway';
import SNT from 'Embark/contracts/SNT';
import axios from 'axios';

window.SNTGiveaway = SNTGiveaway;
window.SNT = SNT;

class App extends React.Component {

    constructor(props) {
      super(props);
      this.state = {
        error: false,
        errorMessage: '',
        ready: false,
        showENSLink: false
      };
    }

    componentDidMount(){
        EmbarkJS.onReady(async (error) => {
            
            if(error){
                this.setState({error: true, errorMessage: "Error loading the DAPP - Contact your nearest Status Core Developer"});
                console.error(error);
                return;
            }

            try {
                await this.start();
            } catch (error) {
                this.setState({error: true, errorMessage: "Error loading the DAPP - Contact your nearest Status Core Developer"});
                console.error(error);
                return;
            }
        });
    }

    async redirectIfProcessed(code){
        const sentToAddress =  await SNTGiveaway.methods.sentToAddress(web3.eth.defaultAccount).call();
        const usedCode =  await SNTGiveaway.methods.codeUsed( '0x' + code,).call();
        if(sentToAddress && usedCode){
            this.setState({showENSLink: true});
        }
    }

    async start(){
        const code = location.search.replace("?", '');        // QR code value, i.e.: a8cd4b33bc
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

        await this.redirectIfProcessed(code);

        if(!this.state.showENSLink){
            const validRequest = await SNTGiveaway.methods.validRequest(proof, '0x' + code, web3.eth.defaultAccount).call();
            if(!validRequest){
                this.setState({error: true, errorMessage: "Invalid Code"});
                console.error("Request is not valid according to contract");
                return;
            }

            // Create / Open a database
            const response = await axios.get('http://localhost:3000/isProcessing/' + code); // TODO: extract to config
            if(!response.data.result){
                const record = {
                    code,
                    address: web3.eth.defaultAccount,
                    proof: proof.map(x => '0x' + x.toString('hex'))
                }

                const response = await axios.post('http://localhost:3000/requestFunds/', record);
                if(response.data.error){
                    this.setState({error: true, errorMessage: response.data.message});
                }

                // TODO: avoid people spamming with localstorage
            }

            setInterval(async () => {
                await this.redirectIfProcessed(code);
            }, 10000);
        }


        this.setState({ready: true});
    }
  
    render(){
        const {error, errorMessage, ready, showENSLink} = this.state;

        return <Fragment>
            { error && <h2>{errorMessage}</h2> }

            { !ready && !error && <h2>Add a loading message / indicator that the dapp is checking whether the code is valid or not </h2> }
            
            { ready && !error && !showENSLink && <h2>Add a message indicating that the code has been received, and we're processing the trx</h2> }

            { showENSLink && !error && <h2>Show link or redirect to ENS DAPP</h2> }
        </Fragment>
    }
  }
  

ReactDOM.render(<App></App>, document.getElementById('app'));
