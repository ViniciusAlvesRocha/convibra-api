pragma solidity ^0.5.0;

contract CertificateInterface{
    function addRecipient(address recipient) public returns (bool success);
    function addIssuer(address issuer) public returns (bool success);
    function isRecipient(address recipient) public view returns (bool success);
    function isIssuer(address issuer) public view returns (bool success);
    function issueCertificate(string memory fileName,string memory signature,string memory certificateData) public returns (bool success);
    function addCertificate(string memory fileName,string memory signature,string memory certificateData) public returns (bool success);
    function claimCertificate(string memory fileName,address issuer,string memory signature) public returns (bool success);
    function verifyCertificate(string memory fileName,address inviter,string memory signature) public returns(bool success);
    function getCertificate(string memory fileName,address uploader) public view returns (uint uploadedBy,bool isCertified,bool isClaimed,address recipient,address issuer,string memory certificateData);
}