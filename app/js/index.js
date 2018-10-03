import React, { Fragment } from 'react';
import ReactDOM from 'react-dom';
import EmbarkJS from 'Embark/EmbarkJS';
import web3 from 'Embark/web3'
import merkleData from './merkle';
const { sha3 } = require('ethereumjs-util');


import SNTGiveaway from 'Embark/contracts/SNTGiveaway';
window.SNTGiveaway = SNTGiveaway;

class App extends React.Component {

    constructor(props) {
      super(props);
    }

    componentDidMount(){
        EmbarkJS.onReady(async (error) => {
            if(error){
                alert("Error loading the DAPP");
                return;
            }


            const code = location.hash.replace("#");        // QR code value, i.e.: a8cd4b33bc
            const hashedCode = sha3(code);                  // Code converted to format used on merkletree
            const accounts = await web3.eth.getAccounts();

            web3.eth.defaultAccount = accounts[0];




            // TODO: if code is empty show error or something
            // TODO: Build merkle tree using merkledata.elements   (see https://github.com/ameensol/merkle-tree-solidity)
            // TODO: Call the contract function validRequest(bytes32[] _proof, bytes5 _code, address _dest)
            //          The values to send are, a merkle proof, code, and the web3.eth.defaultAccount.   
            //          The merkle proof function uses a bytes32 hash, so you need to use hashedCode
            // TODO: if result is false, show error or something because the code is invalid or has been used
            // TODO: if result is true the code hasn't been processed. Proceed to verify if the background service will process that transaction
            // TODO:    use orbit db, check if exist a value in a orbitdb keyvalue store  `status-hackathon-transactions2`  Address of db can be seen by executing node server/main.js
            //          the key to use is the code
            // TODO:    if a value exists,  the background service will process this code, show a message indicating that transaction is being processed
            // TODO:    if it doesnt, 
            //               let's add a value to the status-fund-requests2 orbitdb log store, with a json containing the data used to invoke the validRequest contract function (all values must be strings): {code, proof: proof: proof.map(x => '0x' + x.toString('hex')), address}
            //               show a message indicating that transaction is being processed
            //             

            // We'll deal with the redirect to ENS Registration after the previous code is implemented, and the background service is done processing the transaction



        });
        
    }
  
    render(){
     return <h1>Hello World</h1>
        
    }
  }
  

ReactDOM.render(<App></App>, document.getElementById('app'));
