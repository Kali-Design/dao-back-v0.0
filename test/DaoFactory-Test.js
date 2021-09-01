/* eslint-disable no-unused-vars */

const { accounts, contract } = require('@openzeppelin/test-environment');
const { time } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');

const DaoFactory = contract.fromArtifact('DaoFactory');

describe('DaoFactory', async function () {
  const [DaoFactory, daoFactory, dev, alice, bob] = accounts;
  const NAME = 'Test 1 Token';
  const URL = 'https://www.test1';
  const TOKEN_NAME = `${NAME} Token`;
  const TOKEN_SYMBOL = 'HM1';
  const ID = 1;

  beforeEach(async function () {
    [dev, alice, bob] = await ethers.getSigners();
    DaoFactory = await ethers.getContractFactory('DaoFactory');
    daoFactory = await DaoFactory.connect(dev).deploy();
    await daoFactory.deploy (); //deploy-DaoFactory
    await daoFactory.connect(alice).create(NAME, URL, TOKEN_NAME, TOKEN_SYMBOL);
  });

  it('should create a Test with good name', async function () {
    expect(await daoFactory.nameOf(ID)).to.equal(NAME);
  });
  it('should create a Test with good url', async function () {
    expect(await daoFactory.urlOf(ID)).to.equal(URL);
  });
  it('should create a Test with good author', async function () {
    expect(await daoFactory.authorOf(ID)).to.equal(alice.address);
  });
  it('should create a Test with good creation date', async function () {
    expect(await daoFactory.creationOf(ID)).to.above(0);
  });
  it('should create a Test with a new Dao contract address', async function () {
    expect(await daoFactory.daoAddressOf(ID)).to.not.equal(ethers.constants.AddressZero);
  });
});
