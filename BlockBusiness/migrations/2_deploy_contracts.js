var Trade = artifacts.require("./Trade.sol");
var SafeMath = artifacts.require("./SafeMath.sol");

module.exports = function(deployer) {
  deployer.deploy(Trade);
  deployer.deploy(SafeMath);
  deployer.link(Trade, SafeMath);
  
};
