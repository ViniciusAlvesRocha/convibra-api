module.exports = {
    // this is a safe thresold. Since the balance will be updated 
    // after block generation. This would be safe if we use larger value
    // for claiming contract call it takes 0.001 ETH for 1 call 
    // and for certificate creation it takes 0.003 ETH for 1 call
    
    // AMOUNTS ARE IN ETHER
    ISSUER_MINIMUM_ACCOUNT_THRESHOLD:"0.1",
    ISSUER_INCREMENT_SUPPLY:"0.5",
    ISSUER_INITIAL_SUPPLY:"1",

    RECIPIENT_MINIMUM_ACCOUNT_THRESHOLD:"0.05",
    RECIPIENT_INCREMENT_SUPPLY:"0.08",
    RECIPIENT_INITIAL_SUPPLY:"0.1",
}