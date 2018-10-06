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
        showENSLink: false,
        intervalCheck: false,
        showError: false
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

    async redirectIfProcessed(code, intervalCheck){
        const sentToAddress =  await SNTGiveaway.methods.sentToAddress(web3.eth.defaultAccount).call();
        const usedCode =  await SNTGiveaway.methods.codeUsed( '0x' + code,).call();
        if(sentToAddress && usedCode){
            this.setState({showENSLink: true, intervalCheck});
            setTimeout(() => {
                // TODO: set ENS url
                window.location = "http://www.google.com";
            }, 7000);
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
            const response = await axios.get('http://138.68.78.11:3000/isProcessing/' + code); // TODO: extract to config
            if(!response.data.result){
                const record = {
                    code,
                    address: web3.eth.defaultAccount,
                    proof: proof.map(x => '0x' + x.toString('hex'))
                }

                const response = await axios.post('http://138.68.78.11:3000/requestFunds/', record); // TODO:
                if(response.data.error){
                    this.setState({error: true, errorMessage: response.data.message});
                }

                // TODO: avoid people spamming with localstorage
            }

            setInterval(async () => {
                await this.redirectIfProcessed(code, true);
            }, 10000);
        }


        this.setState({ready: true});
    }

    showErrorMessage(){
        this.setState({showErrorMessage: !this.state.showErrorMessage});
    }
  
    render(){
        const {error, errorMessage, ready, showENSLink, showErrorMessage, intervalCheck} = this.state;

        let className = "blue";
        if(error) className = "red";
        if(!ready && !error) className = "blue";
        if(ready && !error && showENSLink && !intervalCheck) className = "yellow";
        if(ready && !error && showENSLink && intervalCheck) className = "green";

        let messageTitle;
        let messageBody;
        switch(className){
            case "blue":
                messageTitle = "Transaction is being processed";
                messageBody = <Fragment><p>You will shortly receive some ETH and SNT, just for attending #CryptoLife! Use it to register an ENS Name and buy food.</p><p>We hope you have a wonderful time bringing crypto closer to life with us.</p></Fragment>
                break;
            case "red":
                messageTitle = "Shit bro, there was an error"; 
                messageBody = <p>Please ask a volunteer for help in person.</p>;
                break;
            case "yellow":
                messageTitle = "You've already been funded";
                messageBody = <p>We're redirecting you to ENS to register your own username! Ask a volunteer for help if you get lost.</p>
                break;
            case "green":
                messageTitle = "Great success! Such future";
                messageBody = <p>We're redirecting you to ENS to register your own username! Ask a volunteer for help if you get lost.</p>
                break;
        }

        return <div className={className + " container"}>
            <div id="image">
            
            </div>
            <div className="message-title" onClick={(e) => this.showErrorMessage()}>
                {messageTitle}
            </div>
            <div className="message-body">
                {messageBody}
            </div>

            { error && showErrorMessage && <div className="errorMessage">{errorMessage}</div> } 
        </div>
    }
  }
  

ReactDOM.render(<App></App>, document.getElementById('app'));
