import React, { Fragment } from 'react';
import ReactDOM from 'react-dom';
import EmbarkJS from 'Embark/EmbarkJS';
import web3 from 'Embark/web3'
import SNTGiveaway from 'Embark/contracts/SNTGiveaway';
import SNT from 'Embark/contracts/SNT';
import axios from 'axios';
import config from './config';

window.SNTGiveaway = SNTGiveaway;
window.SNT = SNT;


window.addEventListener('load', async () => {
    // Modern dapp browsers...
    if (window.ethereum) {
        window.web3 = new Web3(ethereum);
        try {
            // Request account access if needed
            await ethereum.enable();
        } catch (error) {
            alert('Access to ETH wallet required to send funds');
        }
    }
    // Legacy dapp browsers...
    else if (window.web3) {
        window.web3 = new Web3(web3.currentProvider);
    }
    // Non-dapp browsers...
    else {
        alert('Non-Ethereum browser detected. You should consider using Status.im!');
    }

});


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
       this.setup();
    }

    setup(){
        EmbarkJS.onReady(async (error) => {
            const accounts = await web3.eth.getAccounts();

            if(!accounts.length){
                this.setState({error: true, errorMessage: "No accounts are available"});
                return;
            }

            web3.eth.defaultAccount = accounts[0];

            if(error){
                this.setState({error: true, errorMessage: "Error loading the DAPP - Contact your nearest Status Core Developer"});
                alert(error);
                return;
            }

            try {
                await this.start();
            } catch (error) {
                if(error.response && error.response.data){
                    this.setState({error: true, errorMessage: error.response.data});
                } else {
                    this.setState({error: true, errorMessage: error.message});
                }
                alert(error);
                return;
            }
        });
    }


    async redirectIfProcessed(code, intervalCheck){
        const sentToAddress =  await SNTGiveaway.methods.sentToAddress(web3.eth.defaultAccount).call({from: web3.eth.defaultAccount});
        const usedCode =  await SNTGiveaway.methods.codeUsed( '0x' + code,).call({from: web3.eth.defaultAccount});
        if(sentToAddress && usedCode){
            this.setState({showENSLink: true, intervalCheck});
            setTimeout(() => {
                window.location = config.ENSDappURL;
            }, 7000);
        }
    }

    async start(){
        const code = location.search.replace("?", '');
        const accounts = await web3.eth.getAccounts();

        web3.eth.defaultAccount = accounts[0];

        if(!code) {
            this.setState({error: true, errorMessage: "Code is required"});
            return;
        }
        
        await this.redirectIfProcessed(code);

        if(!this.state.showENSLink){
            const response = await axios.get(config.APIServer + '/isProcessing/' + code);
            if(!response.data.result){
                const record = {
                    code,
                    address: web3.eth.defaultAccount
                }

                const response = await axios.post(config.APIServer + '/requestFunds/', record);
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
                messageTitle = "Shit, there was an error"; 
                messageBody = <p>Please ask a volunteer for help in person.</p>;
                break;
            case "yellow":
                messageTitle = "You've already been funded!";
                messageBody = <p>We're redirecting you to ENS to register your own username! Ask a volunteer for help if you get lost.</p>
                break;
            case "green":
                messageTitle = "Great success! Such future!";
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
