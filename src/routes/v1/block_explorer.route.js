const route = require("express").Router();
const BlockExplorerController = require("../../controller/block_explorer.controller");

route.get('/summary',BlockExplorerController.getSummary);
route.get('/blocks',BlockExplorerController.getBlocks);
route.get('/block/:blockHash',BlockExplorerController.getBlockDetails);
route.get('/tx/:txHash',BlockExplorerController.getTxDetails);
route.get('/address/:address',BlockExplorerController.getAddressDetails);
route.get('/guess_entity',BlockExplorerController.guessEntity);

module.exports = route;