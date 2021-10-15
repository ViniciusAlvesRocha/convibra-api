const ethers = require('ethers');

/************************************************************************************
     Following is example for delegatedIssue of merkleRoot Hash 
     Similar process can be followed for delegatedRevoke of individual certificate
 ************************************************************************************/

/* Ethereum Provider */
let ethProvider = new ethers.providers.InfuraProvider('rinkeby','7bd74eb888ef4cbdbc9923b637451c3b');

/* Issuer Wallet */
let issuerPrivateKey = "1ACC27DABFF4DAADCF267F24AE582AF3D6743AF12BFF647951E07F62012A7983";
let issuerWallet = new ethers.Wallet(issuerPrivateKey, ethProvider);

console.log("Account Admin/Issuer Address: ",issuerWallet.address);

/* Relayer Wallet */

let relayerPrivateKey = "99B4363DC0F426B048F703517E9CDDF825973EC17CB4DBB82754FDFB584DE530";
let relayerWallet = new ethers.Wallet(relayerPrivateKey, ethProvider);

console.log("Relayer Address: ",relayerWallet.address);

/* Contract ABI */
let networkId = "4";
let contractJSON = (require("../smart_contract/build/contracts/DocumentStore.json"));
let contractAbi = contractJSON.abi;
let contractAddress = contractJSON.networks[networkId].address;
let contractInstance = new ethers.Contract(contractAddress, contractAbi, relayerWallet);

let _merkleRootHash = ethers.utils.id("Document12345678912");

console.log("Document Store Address:",contractAddress);

(async () => {

    /* Check if merkle root is already published */
    let merkleRootStatus = await contractInstance.isIssued(_merkleRootHash);

    if(!merkleRootStatus)
    {
        /*  Note: messageHash is a string, that is 66-bytes long, to sign the
           binary value, we must convert it to the 32 byte Array that
           the string represents */

        let _merkleRootHashBytes = ethers.utils.arrayify(_merkleRootHash)

        // Sign the string message
        let flatSig = await issuerWallet.signMessage(_merkleRootHashBytes);

        // For Solidity, we need the expanded-format of a signature
        let sig = ethers.utils.splitSignature(flatSig);

        let _nonce = await contractInstance.nonces(issuerWallet.address);

        _nonce = parseInt(_nonce.toString());
        _nonce++;

        // Call the verifyString function
        console.log("Publishing Merkle Root ...");
        let recovered = await contractInstance.delegatedIssue(_merkleRootHash,_nonce,sig.v, sig.r, sig.s);

        let tx  = await recovered.wait();
        console.log("TX:  ",tx.transactionHash);
    }
    else
    {
        console.error("Merkle Root Already Published under this document store");
    }
    

    
    

    
})();
