## Intro
* Sta cemo da pravimo?
* Primer password menadzera (pokazati LastPass recimo)
* Ukratko sta je DApp (posto o tome slusaju vec danima)
* Sta cemo sve da koristimo?
	* MetaMask
	* Web3JS
	* Solidity
	* IPFS
	* React
* Sta je MetaMask?
* Sta je Web3JS?
* Sta je IPFS? -> o ovome kratko posto su slusali vec dosta o tome
- - - -
## Setup
* Instalirati MetaMask
	* Kreiranje adrese
		* Sta je backup phrase?
	* Biranje Ropsten testnet-a
	* Uzimanje ETH sa faucet-a
	* Pregled transakcije na etherscan-u
* Create react app
* Dodavanje Web3JS
	* `yarn add web3`
* Dodavanje IPFS
	* `yarn add ipfs-api`
- - - -
## Contract
* [Remix](https://remix.ethereum.org/#optimize=false&version=soljson-v0.4.25+commit.59dbf8f1.js)
* `PasswordManager.sol` `0x965f1178c9c025e508163e1a759a43e3a356392d`
```solidity
pragma solidity ^0.4.25;
contract PasswordManager {
    address public passwordOwner;

    string ipfsHash;
    
    constructor() public {
        passwordOwner = msg.sender;
    }

    function sendHash(string x) public {
        assert(msg.sender == passwordOwner);
        ipfsHash = x;
    }

    function getHash() public view returns (string x) {
        return ipfsHash;
    }
}
```
* Copy the ABI -> Sta je ABI?
* Copy address -> Sta ce nam ovo?
	* Pokazati `getHash` kroz Remix-ov GUI
* Napraviti `storeHash.js`:
```javascript
import web3 from 'web3';

const address = '0x965f1178c9c025e508163e1a759a43e3a356392d';

const abi = [
  {
    "constant": false,
    "inputs": [
      {
        "name": "x",
        "type": "string"
      }
    ],
    "name": "sendHash",
    "outputs": [],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "getHash",
    "outputs": [
      {
        "name": "x",
        "type": "string"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "passwordOwner",
    "outputs": [
      {
        "name": "",
        "type": "address"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  }
];

export default new web3.eth.Contract(abi, address);
```
- - - -
## IPFS file
* Sta je infura?
```javascript
const IPFS = require('ipfs-api');

const ipfs = new IPFS({
  host: 'ipfs.infura.io',
  port: 5001,
  protocol: 'https',
});

export default ipfs;
```
- - - -
## Front-end
* Create hard-coded passwords:
```javascript
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
```
* Create `PasswordRow` component:
```jsx
import React, {Component} from "react";

export default class PasswordRow extends Component {
  constructor({website, username, password, onUpdatePassword}) {
    super();

    this.state = {website, username, password, onUpdatePassword, showPassword: false};
  }

  onClick = () => {
    const {website, username, password, onUpdatePassword} = this.state;
    onUpdatePassword(website, username, password);
  };

  onChange = (event) => {
    this.setState({password: event.target.value});
  };

  toggleShowPassword = () => {
    const showPassword = !this.state.showPassword;
    this.setState({showPassword});
  };

  render() {
    const {website, username, password, showPassword} = this.state;

    return (
      <tr className='password-row'>
        <td>{website}</td>
        <td>{username}</td>
        <td>
          <input type={showPassword ? 'text' : 'password'} value={password} onChange={this.onChange}/>
        </td>
        <td>
          <button onClick={this.toggleShowPassword}>Show password</button>
          <button onClick={this.onClick}>Update password</button>
        </td>
      </tr>
    );
  }
}
```
* Wire up password to the `PasswordRow`  component
* Add `enterNewAccount` function:
```javascript
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
```
- - - -
## Update password
* `yarn add cryptico`
* Korak po korak napisati `updateMasterPasswordFile`:
```javascript
updateMasterPasswordFile = async () => {
  const {passwords, contract, ethAccount} = this.state;

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

  const buffer = Buffer.from(cipherText);

  await ipfs.add(buffer, (error, result) => {
    if (error) {
      alert(`Error when upload to IPFS: ${error}`);
      return;
    }

    const ipfsHash = result[0].hash;

    contract.methods.sendHash(ipfsHash).send({
      from: ethAccount
    }, (error, transactionHash) => {
      this.setState({transactionHash, ipfsHash});
    });
  });
};
```
- - - -
## Web3
* Web3 kao biblioteka za povezivanje sa MetaMask-om
* Od 2gog novembra `ethereum.enable()`
* Import contract ABI-a i adrese contract-a
```javascript
async componentDidMount() {
  if (window.ethereum) {
    window.web3 = new Web3(ethereum);

    try {
      await ethereum.enable();

      const accounts = await web3.eth.getAccounts();

      if (accounts.length === 0) {
        alert('User doesn\'t have any MetaMask accounts!');
        return;
      }

      const contract = new web3.eth.Contract(storeHash.abi, storeHash.address);

      this.setState({ethAddress: accounts[0], contract, contractAddress: await contract.options.address});
    } catch (error) {
      alert(`User rejected access to MetaMask accounts: ${error}`);
    }
  } else {
    alert('This application needs MetaMask in order to work');
  }
}
```
- - - -
## IPFS upload
* Videti iznad deo koda vezan za IPFS upload i proci korak po korak
* Pokazati IPFS gateway
* Pokazati Etherscan nakon sto se store-uje (ume da zabaguje metamask pa treba da se ponovo samo pokrene transakcija)
- - - -
## IPFS download
* Sada kada imamo store-ovan file na ipfs i sacuvan na ethereum-u treba da ucitamo nas password file
* Zakomentarisati password u kontrukstoru komponente
```javascript
loadMasterPasswordFile = async () => {
  const {contract} = this.state;

  const masterPassword = prompt('Please enter your password', '');
  const bits = 1024;

  if (!masterPassword.length) {
    alert('Please enter your password');
    return;
  }

  const ipfsHash = await contract.methods.getHash().call();

  const files = await ipfs.get(ipfsHash);

  const buffer = new Buffer(files[0].content);

  const encryptedPasswords = buffer.toString();

  const rsaKey = cryptico.generateRSAKey(masterPassword, bits);

  const decryptedPasswords = cryptico.decrypt(encryptedPasswords, rsaKey);

  if(decryptedPasswords.status !== 'success') {
    alert('Failed decrypting master password file');
    return;
  }

  const passwords = JSON.parse(decryptedPasswords.plaintext);

  this.setState({ipfsHash, passwords: passwords});
};
```
- - - -
## IPFS & IPNS

> Izbildovati ceo JS bundle i html
* `yarn build`
> Dodati ceo folder
* `ipfs add -r build/` - ovo nam daje cid
> Generisati kljuc
* `ipfs key gen --type=rsa --size=2048 mykey`
> Publishovati pomocu kljuca
* `ipfs name publish --key mykey <cid>` - ovo nam daje ipns-hash
> Dodati TXT rekord sa vrednoscu `dnslink=/ipns/<ipns-hash>`
> Pristupiti preko: gateway.ipfs.io/ipns/<domen>
> Dodati CNAME rekord na gateway.ipfs.io i onda moze da se pristupi samo preko `<domen>`


- - - -
## “Domaci”
* Brisanje sifre
* Jedan contract manage-uje vise password fajlova od vise ljudi (ideja je da koriste hash map-u)
- - - -
## Links
* [Build a simple Ethereum + InterPlanetary File System (IPFS)+ React.js DApp.](https://itnext.io/build-a-simple-ethereum-interplanetary-file-system-ipfs-react-js-dapp-23ff4914ce4e)
* [Never Use Passwords Again with Ethereum and Metamask](https://hackernoon.com/never-use-passwords-again-with-ethereum-and-metamask-b61c7e409f0d)
* [A complete guide to building Ethereum DApps with MetaMask](https://medium.com/crowdbotics/building-ethereum-dapps-with-meta-mask-9bd0685dfd57)
* [Breaking Change: No Longer Injecting Web3 – MetaMask](https://medium.com/metamask/https-medium-com-metamask-breaking-change-injecting-web3-7722797916a8)
- - - -
