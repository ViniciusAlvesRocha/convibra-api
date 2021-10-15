const ethers = require('ethers');

/************************************************************************************
    Following is example for scripted contract deployment 
    viz. DocumentStore in this project 
 ************************************************************************************/

/* Ethereum Provider */
let ethProvider = new ethers.providers.InfuraProvider('rinkeby','7bd74eb888ef4cbdbc9923b637451c3b');

/* Relayer Wallet */

let relayerPrivateKey = "99B4363DC0F426B048F703517E9CDDF825973EC17CB4DBB82754FDFB584DE530";
let relayerWallet = new ethers.Wallet(relayerPrivateKey, ethProvider);

console.log("Relayer Address: ",relayerWallet.address);

/* Contract ABI */
let networkId = "4";
let contractJSON = (require("../smart_contract/build/contracts/DocumentStore.json"));
let contractAbi = contractJSON.abi;
let contractBytecode = contractJSON.bytecode;





(async () => {

     // Create an instance of a Contract Factory
    let factory = new ethers.ContractFactory(contractAbi, contractBytecode, relayerWallet);    
    
    // parameter to the constructor

    let documentStore = {
        owner: "0xA6A2f9Cc7c949C0d6bcfaBE6766BD221bccBa5c2",
        name: "UniszaTest",
        id: "Test123456"
    }

    let contractInstance = await factory.deploy(documentStore.owner,documentStore.id,documentStore.name);

    console.log("Deploying Contract ...");
    await contractInstance.deployed()

    console.log("Contract Deployment Completed, Address: ",contractInstance.address);

})();
