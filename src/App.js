/* eslint-disable no-undef */
import React, {Component} from 'react';
import cryptico from 'cryptico';
import PasswordRow from './passwordRow';
import './App.css';

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      ethAddress: null,
      passwords: [
        {
          "website": "google.com",
          "username": "bogdan.habic@mvpworkshop.co",
          "password": "ovojemojasifra"
        },
        {
          "website": "slack.com",
          "username": "bogdan.habic@mvpworkshop.co",
          "password": "slacksifra"
        },
      ],
    }
  }

  componentDidMount() {
    if (window.ethereum) {
      window.web3 = new Web3(ethereum);

      ethereum.enable().then(function () {
        const accounts = web3.eth.accounts;

        if (accounts.length === 0) {
          alert('User doesn\'t have any MetaMask accounts!');
          return;
        }

        this.setState({ethAddress: accounts[0]});
      }.bind(this)).catch(function (error) {
        alert(`User rejected access to MetaMask accounts: ${error}`);
      })
    } else {
      alert('This application needs MetaMask in order to work');
    }
  }

  updatePassword = (website, username, password) => {
    const {passwords} = this.state;

    passwords.forEach(function (accountInfo) {
      if (accountInfo.website === website && accountInfo.username === username) {
        accountInfo.password = password;
      }
    });

    this.setState({passwords});
  };

  enterNewAccount = () => {
    const website = prompt('Please enter the website', '');

    if (!website.length) {
      alert('Please enter a website');
    }

    const username = prompt('Please enter the username', '');

    if (!username.length) {
      alert('Please enter a username ');
    }

    const password = prompt('Please enter the password', '');

    if (!password.length) {
      alert('Please enter a password ');
    }

    const {passwords} = this.state;

    passwords.push({website, username, password});

    this.setState({passwords});
  };

  updateMasterPasswordFile = () => {
    const {passwords} = this.state;

    const masterPassword = prompt('Enter master password', '');
    const repeatPassword = prompt('Repeat master password', '');

    if (!masterPassword.length || masterPassword !== repeatPassword) {
      alert('Please enter the same password in both fields');
      return;
    }

    const bits = 1024;

    const rsaKey = cryptico.generateRSAKey(masterPassword, bits);
    const publicKey = cryptico.publicKeyString(rsaKey);

    const json = JSON.stringify(passwords);

    const encryptedJson = cryptico.encrypt(json, publicKey);

    if (encryptedJson.status !== 'success') {
      alert('Couldn\'t encrypt passwords');
      return;
    }

    const cipherText = encryptedJson.cipher;

    const decryptedText = cryptico.decrypt(cipherText, rsaKey);

    const decryptedJson = JSON.parse(decryptedText.plaintext);
  };

  render() {
    const updatePassword = this.updatePassword;
    const {ethAddress, passwords} = this.state;

    return (
      <div className="App">
        <p>
          ETH address: {ethAddress}
        </p>
        <table className='password-table'>
          <thead>
          <tr>
            <td>Website</td>
            <td>Username</td>
            <td>Password</td>
            <td>Actions</td>
          </tr>
          </thead>
          <tbody>
          {passwords.map(function ({website, username, password}) {
            return <PasswordRow website={website} username={username} password={password}
                                onUpdatePassword={updatePassword}
                                key={`${website}-${username}`}/>
          })}
          </tbody>
        </table>
        <div>
          <button className='main-update-btn' onClick={this.enterNewAccount}>
            Enter new account
          </button>
        </div>
        <div>
          <button className='main-update-btn' onClick={this.updateMasterPasswordFile}>
            Update master password file
          </button>
        </div>
      </div>
    );
  }
}

export default App;
