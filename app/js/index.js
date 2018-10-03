import React, { Fragment } from 'react';
import ReactDOM from 'react-dom';
import EmbarkJS from 'Embark/EmbarkJS';
import web3 from 'Embark/web3'
//import SimpleStorage from 'Embark/contracts/SimpleStorage';
class App extends React.Component {

    constructor(props) {
      super(props);
    }
  
    render(){
     return <h1>Hello World</h1>
        
    }
  }
  

ReactDOM.render(<App></App>, document.getElementById('app'));
