const HDWalletProvider = require("truffle-hdwallet-provider");
require("dotenv").config();

const ropstenPrivateKey = process.env.ROPSTEN_KEY;
const rinkebyPrivateKey = '';

module.exports = {
  compilers: {
    solc: {
      version: "0.5.16",
      settings: {
        optimizer: {
          enabled: true,
          runs: 200
        }
      }
    }
  },
  networks: {
    development: {
      host: "54.174.109.234",
      port: 27015,
      gas: 6000000,
      network_id: "42", // Match any network id,
      from:"0x4ba48d25532d267ee4b4e07516a9152f36d95f2e", /*  Unlocked */
      skipDryRun:true
    },
    docker: {
      host: "ganache",
      port: 8545,
      gas: 6721975,
      network_id: "*" // Match any network id
    },
    rinkeby: {
      network_id: 4,
      skipDryRun: true,
      provider: () =>
        new HDWalletProvider(
          '99B4363DC0F426B048F703517E9CDDF825973EC17CB4DBB82754FDFB584DE530',
          `https://rinkeby.infura.io/v3/7bd74eb888ef4cbdbc9923b637451c3b`
        )
    }
  }
};
