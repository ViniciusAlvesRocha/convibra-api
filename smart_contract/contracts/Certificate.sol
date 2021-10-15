pragma solidity ^0.5.0;

import "./Owned.sol";

contract Certificate is Owned{
    enum User{
        ISSUER,RECIPIENT
    }
    
    struct CertificateInfo{
        User uploadedBy;
        bool isClaimed;
        bool isRevoked;
        bool isExits; // extra flag for existence checking
        string certificateData;
        address recipient;
        address issuer;
    }
    
    mapping(string=>CertificateInfo) certificates;
    mapping(address=>bool) verifiedIssuers;
    mapping(address=>bool) verifiedRecipients;
    
    modifier onlyVerifiedIssuer{
        require(verifiedIssuers[msg.sender],"Issuer not verified");
        _;
    }
    
    modifier onlyRecipient{
        require(verifiedRecipients[msg.sender],"Recipient not found");
        _;
    }
    
    /* Events */

    event RecipientAdded(address indexed user, address indexed performedBy, uint indexed time);
    event RecipientRevoked(address indexed user, address indexed performedBy, uint indexed time);

    event IssuerAdded(address indexed user, address indexed performedBy, uint indexed time);
    event IssuerRevoked(address indexed user, address indexed performedBy, uint indexed time);

    event CertificateIssued(string indexed targetHash, address indexed performedBy, uint indexed time);
    event CertificateClaimed(string indexed targetHash, address indexed performedBy, uint indexed time);
    event CertificateRevoked(string indexed targetHash, address indexed performedBy, uint indexed time);


    function addRecipient(address recipient) public onlyOwner returns (bool success){
            verifiedRecipients[recipient] = true;

            emit RecipientAdded(recipient,msg.sender,now);
            return true;
    }
    
    function addIssuer(address issuer) public onlyOwner returns (bool success){
            verifiedIssuers[issuer] = true;

            emit IssuerAdded(issuer,msg.sender,now);
            return true;
    }

    function removeRecipient(address recipient) public onlyOwner returns (bool success){
            verifiedRecipients[recipient] = false;

            emit RecipientRevoked(recipient,msg.sender,now);
            return true;
    }
    
    function removeIssuer(address issuer) public onlyOwner returns (bool success){
            verifiedIssuers[issuer] = false;

            emit IssuerRevoked(issuer,msg.sender,now);
            return true;
    }
    
    function isRecipient(address recipient) public view returns (bool success){
        return verifiedRecipients[recipient];
    }
    
    function isIssuer(address issuer) public view returns (bool success){
            return verifiedIssuers[issuer];
    }
    
    /* To be called by issuer while certificate issuance */
    function issueCertificate(string memory targetHash,address recipient,string memory certificateData) public onlyVerifiedIssuer returns (bool success){

        /* 
            User uploadedBy;
            bool isClaimed;
            bool isRevoked;
            bool isExits; // extra flag for existence checking
            string certificateData;
            address recipient;
            address issuer;
         */
        certificates[targetHash] = CertificateInfo(User.ISSUER,false,false,true,certificateData,recipient,msg.sender);

        emit CertificateIssued(targetHash,msg.sender,now);
        return true;
    }

   
    /* To be called by recipient while claiming certificate */
    function claimCertificate(string memory targetHash) public onlyRecipient returns (bool success){
        require(certificates[targetHash].isExits == true,"Certificate does not exits");
        require(certificates[targetHash].recipient == msg.sender,"Certificate can be only claimed by assigned recipient");

        certificates[targetHash].isClaimed = true;

        emit CertificateClaimed(targetHash,msg.sender,now);
        return true;
    }
    
    /* To be called by recipient while claiming certificate */
    function revokeCertificate(string memory targetHash) public onlyVerifiedIssuer returns (bool success){
        require(certificates[targetHash].isExits,"Certificate does not exits");
        require(certificates[targetHash].issuer == msg.sender,"Certificate can be revoked by issuer only");
        
        certificates[targetHash].isRevoked = true;

        emit CertificateRevoked(targetHash,msg.sender,now);
        return true;
    }
    
    function getCertificate(string memory targetHash) public view returns (
        uint uploadedBy,
        bool isRevoked,
        bool isClaimed,
        address recipient,
        address issuer,
        string memory certificateData){
        require(certificates[targetHash].isExits == true,"Certificate does not exits");
        return (
            uint(certificates[targetHash].uploadedBy),
            certificates[targetHash].isRevoked,
            certificates[targetHash].isClaimed,
            certificates[targetHash].recipient,
            certificates[targetHash].issuer,
            certificates[targetHash].certificateData
        );
    }
}