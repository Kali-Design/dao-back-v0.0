const DaoFactory = artifacts.require('DaoFactory');

module.exports = async (deployer, accounts) => {
  await deployer.deploy(DaoFactory, accounts[0], { from: accounts[0] });
};