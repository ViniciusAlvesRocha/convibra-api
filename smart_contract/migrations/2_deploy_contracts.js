var Certificate = artifacts.require("./Certificate.sol");

module.exports = function(deployer) {
  deployer.deploy(Certificate)
  .then(() => console.log("My contract address: ",Certificate.address));
};
