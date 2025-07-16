const Web3 = require('web3');
require('dotenv').config();
const contractABI = require('./BellshireLogic.json'); // Load JSON with require
require('dotenv').config();

const contractAddress = process.env.PROXY_TOKEN_CONTRACT_ADDRESS;
const web3 = new Web3(process.env.RPC_URL); 


const getContract = () => {
  return new web3.eth.Contract(contractABI.abi, contractAddress);
};

module.exports = { getContract };

