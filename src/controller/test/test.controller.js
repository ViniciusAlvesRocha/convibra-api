var ResponseHandler = require("../../util/response-handler");
var UniblockGatewayService = require("../../service/uniblock-gateway.service");
var FileService = require("../../service/file.service");
var BootupService = require("../../service/bootup-service");
var docx = require("../../util/docx-to-pdf-util");

async function testResponse(req,res){

   /* let _provider = await autoloaded.ChainService.getProviderInstance('uniblocknet');
   let _relayerPrivateKey = await autoloaded.ChainService.getRelayerPrivateKey();
   let _relayerPrivateKey = "0x873ff6e43613b345bcb799b90c9bbeb8fa4dec6243a94ca705344309f5370ab6";
   let _wallet = await autoloaded.ChainService.getWalletInstance(_relayerPrivateKey, _provider);
   let _certificateInstance = await autoloaded.ChainService.getCertificateInstance(_wallet); */

   
   /* console.log(_provider,"Provider");
   console.log(_relayerPrivateKey,"Private Key");
   console.log(_wallet,"Wallet");
   console.log(_certificateInstance,"Contract"); */

    /* let options = {
        nonce: await autoloaded.ChainService.getNonce(_wallet.address, true)
    }
    console.log(options,"Nonce"); */

    /* try
    {
        let tx = await _certificateInstance.addIssuer("0xe58dc15e85011128be314596f47bcb3af3bfcb67",options);
        console.log(await tx.wait(),"Contract Instance");
    }
    catch(e)
    {
        console.log(e.message,"Error");
    } */


    /* let tx = await _certificateInstance.isIssuer("0xe58DC15E85011128Be314596F47Bcb3aF3bfcb67",options);
    console.log(tx,"Contract Instance"); */

    /* let tx = await _certificateInstance.owner();
    console.log(tx,"Owner");

    console.log((await autoloaded.ChainService.getWalletBalance(_wallet.address,_provider)).toString()); */


    /* Add Recipient to Blockchain */
    /* try{

        let tx = await _certificateInstance.addRecipient("0xCe2F3ddC249039520dd82496Ca3c71524416fb8C",options);
        console.log(await tx.wait(),"Contract Instance");

        let isRecipient = await _certificateInstance.isRecipient("0xCe2F3ddC249039520dd82496Ca3c71524416fb8C",options);
        console.log('isRecipient',isRecipient);

    }catch(e){
        console.log(e.message,"Error");
    } */

    /* Write File from  GFS to Physical */

    /* let _fileName = "fac1509773788a4b2d2d00eecd4985f7bf54315b";
    let _fullFilePath = "generated/fac1509773788a4b2d2d00eecd4985f7bf54315b.pdf";
    let _streamResponse = await autoloaded.FileService.getFileStream(_fileName);

    if(_streamResponse['status'] == 'success')
    {
        try{
            await autoloaded.FileService.writeStreamToFile(_streamResponse['data'],_fullFilePath);
        }
        catch(e)
        {
            console.log("error",e);
        }
    } */

    /* this.qrCodeObject = { 
        'issuer':this.certificateInfo.issuedBy.address,
        'certificateHash':this.certificateInfo.signedCertificate.signature.targetHash,
        'merkleRoot':this.certificateInfo.signedCertificate.signature.merkleRoot,
        'certificateStoreMainnet':this.certificateInfo.rawCertificate.additionalData.mainnet,
        'certificateStoreUniblocknet':this.certificateInfo.rawCertificate.additionalData.uniblocknet
    }; */

    /* QR Code Generation  */
    /* let _qrCodeObject = { 
        'issuer':"this.certificateInfo.issuedBy.address",
    };

    let _qrCertificateData = JSON.stringify(_qrCodeObject);
    let _qrDataUrl = await QRCode.toDataURL(_qrCertificateData)
    let _data = _qrDataUrl.slice('data:image/png;base64,'.length); */


    // docx()

    return ResponseHandler.generateSuccess(res,null,_data);
}   

async function testUniblockGateway(req,res)
{
    let _response = await UniblockGatewayService.getInstanceSettings();

    /* let _certificates = [
        {"certificate_hash":"1584351428","reason":"Invalid Certificate"},
        {"certificate_hash":"1584351434","reason":"Due to Invalid Certificate"}
    ];

    let _response = await UniblockGatewayService.revokeCertificate(_certificates); */

    /* let certficate = {
        "certificateStore[mainnet]": "0x14E5478DE67A6236dCEB9AeF51BA9BDc738dc640",
        "certificateStore[uniblocknet]": "0x873AC7D31980eF8767ab6686B5F4B3796Fbc629b",
        "merkleRoot": "104dd84bf49d3c1bf0fbf2a223a4ddcd7ff27576b1615a1607d6eda6070081dd",
        "targetHash": "75596a8eec82eb727ed6ca967befdd4c86a620049f7dbe1108c3f1aa5d145bfe"
    }

    let _response = await UniblockGatewayService.getCertificateStatus(certficate); */

    /* let _batch = {
        "merkleRoot": "104dd84bf49d3c1bf0fbf2a223a4ddcd7ff27576b1615a1607d6eda6070081dd",
        "validRecords": "100"
    }

    let _response = await UniblockGatewayService.issueCertificateBatch(_batch); */

    return ResponseHandler.generateSuccess(res,_response.message,_response.data);
}

async function configureSuperAdmin(req,res){

    let _response = await BootupService.configureSuperAdmin()

    return ResponseHandler.generateSuccess(res,"Done",_response);
}


module.exports = {
    testResponse: testResponse,
    testUniblockGateway:testUniblockGateway,
    configureSuperAdmin:configureSuperAdmin
}