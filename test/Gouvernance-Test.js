/* eslint-disable no-unused-vars */

const { accounts, contract } = require('@openzeppelin/test-environment');
const { time } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');

describe('Governance', async function () {
  const [Dao, dao, Governance, governance, dev, alice, bob] = accounts;
  const TOKEN_NAME = 'Test 1 Token';
  const TOKEN_SYMBOL = 'HM1';
  const AMOUNT = ethers.utils.parseEther('20');
  const LOCK_AMOUNT = ethers.utils.parseEther('10');
  const MINTER_ROLE = ethers.utils.id('MINTER_ROLE');
  const BURNER_ROLE = ethers.utils.id('BURNER_ROLE');
  const PROPOSER_ROLE = ethers.utils.id('PROPOSER_ROLE');
  const PROPOSAL_ID = 1;
  const PROPOSAL_DESCRIPTION = 'Can I become MINTER of governance token ?';

  beforeEach(async function () {
    [dev, alice, bob] = await ethers.getSigners();
    Dao = await ethers.getContractFactory('Dao');
    dao = await Dao.connect(dev).deploy(dev.address, TOKEN_NAME, TOKEN_SYMBOL);
    await dao.deployed();
    Governance = await ethers.getContractFactory('Governance');
    governance = await Governance.connect(dev).deploy(TOKEN_NAME, TOKEN_SYMBOL);
    await governance.deployed();
  });
  it('should create token with the good name', async function () {
    expect(await governance.name()).to.equal(TOKEN_NAME);
  });
  it('should create token with the good symbol', async function () {
    expect(await governance.symbol()).to.equal(TOKEN_SYMBOL);
  });
  describe('Token Mint', async function () {
    beforeEach(async function () {
      await dao.connect(dev).grantRole(MINTER_ROLE, dev.address);
      await governance.connect(dev).mint(alice.address, AMOUNT);
    });
    it('should mint good amount for alice', async function () {
      expect(await governance.balanceOf(alice.address)).to.equal(AMOUNT);
    });
    it('should burn good amount for alice', async function () {
      await dao.connect(dev).grantRole(BURNER_ROLE, dev.address);
      await governance.connect(dev).burn(alice.address, AMOUNT);
      expect(await governance.balanceOf(alice.address)).to.equal(0);
    });
  });
  describe('Token Lock', async function () {
    beforeEach(async function () {
      await dao.connect(dev).grantRole(MINTER_ROLE, dev.address);
      await governance.connect(dev).mint(alice.address, AMOUNT);
      await governance.connect(alice).approve(governance.address, LOCK_AMOUNT);
      await governance.lock(LOCK_AMOUNT);
    });
    it('should lock the good amount for alice', async function () {
      expect(await governance.votingPowerOf(alice.address)).to.equal(LOCK_AMOUNT);
    });
  });
  describe('Proposal', async function () {
    beforeEach(async function () {
      await dao.connect(dev).grantRole(PROPOSER_ROLE, alice.address);
      await governance.connect(alice).propose(PROPOSAL_DESCRIPTION, alice.address, MINTER_ROLE, true);
    });
    it('should create a proposal with good description', async function () {
      expect(await governance.descriptionOf(PROPOSAL_ID)).to.equal(PROPOSAL_DESCRIPTION);
    });
    it('should create a proposal with good account', async function () {
      expect(await governance.accountOf(PROPOSAL_ID)).to.equal(alice.address);
    });
    it('should create a proposal with good role', async function () {
      expect(await governance.roleOf(PROPOSAL_ID)).to.equal(MINTER_ROLE);
    });
    it('should create a proposal with grant boolean active ', async function () {
      expect(await governance.grantOf(PROPOSAL_ID)).to.equal(true);
    });
  });
  describe('Vote', async function () {
    beforeEach(async function () {
      await dao.connect(dev).grantRole(PROPOSER_ROLE, alice.address);
      await dao.grantRole(MINTER_ROLE, dev.address);
      await governance.connect(dev).mint(dev.address, AMOUNT);
      await governance.mint(alice.address, AMOUNT);
      await governance.mint(bob.address, AMOUNT);
      await governance.approve(governance.address, LOCK_AMOUNT);
      await governance.lock(LOCK_AMOUNT);
      await governance.connect(alice).propose(PROPOSAL_DESCRIPTION, alice.address, MINTER_ROLE, true);
      await governance.approve(governance.address, LOCK_AMOUNT);
      await governance.lock(LOCK_AMOUNT);
      await governance.connect(bob).approve(governance.address, LOCK_AMOUNT);
      await governance.lock(LOCK_AMOUNT);
      await governance.connect(dev).vote(PROPOSAL_ID, 0);
      await governance.connect(alice).vote(PROPOSAL_ID, 0);
      await governance.connect(bob).vote(PROPOSAL_ID, 1);
    });
    it('should read the good number of Yes', async function () {
      expect(await governance.nbYesOf(PROPOSAL_ID)).to.equal(LOCK_AMOUNT.mul(2));
    });
    it('should read the good number of No', async function () {
      expect(await governance.nbNoOf(PROPOSAL_ID)).to.equal(LOCK_AMOUNT);
    });
    it('should approved this proposal', async function () {
      expect(await governance.statusOf(PROPOSAL_ID)).to.equal(1);
    });
    it('should grant Minter role to alice', async function () {
      expect(await governance.hasRole(MINTER_ROLE, alice.address)).to.equal(true);
    });
  });
});
