/* eslint-disable no-unused-vars */

const { accounts, contract } = require('@openzeppelin/test-environment');
const { time } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');

describe('Management', async function () {
  const [Dao, dao, Management, management, dev, alice, bob] = accounts;
  const TOKEN_NAME = 'Test 1 Token';
  const TOKEN_SYMBOL = 'HM1';
  const MANAGER_ROLE = ethers.utils.id('MANAGER_ROLE');
  const EMPLOYEE_ID = 1;
  const SALARY = ethers.utils.parseEther('0.01');
  const AMOUNT = ethers.utils.parseEther('0.1');
  beforeEach(async function () {
    [dev, alice, bob] = await ethers.getSigners();
    Dao = await ethers.getContractFactory('Dao');
    dao = await Dao.connect(dev).deploy(dev.address, TOKEN_NAME, TOKEN_SYMBOL);
    await dao.deployed();
    Management = await ethers.getContractFactory('Management');
    management = await Management.connect(dev).deploy();
    await management.deployed();
    await dao.connect(dev).grantRole(MANAGER_ROLE, alice.address);
  });
  describe('Employ', async function () {
    beforeEach(async function () {
      await management.connect(alice).employ(bob.address, SALARY);
    });
    it('should employ bob with the good id', async function () {
      expect(await management.idOf(bob.address)).to.equal(EMPLOYEE_ID);
    });
    it('should employ bob with the good salary', async function () {
      expect(await management.salaryOf(bob.address)).to.equal(SALARY);
    });
    it('should employ bob with the good employment date', async function () {
      expect(await management.employmentOf(bob.address)).to.above(1);
    });
    it('should fire bob and revert when ask data', async function () {
      await management.connect(alice).fire(bob.address);
      await expect(management.idOf(bob.address)).to.be.revertedWith('Management: this account is not employeed here');
    });
    it('should fire bob and revert when ask data', async function () {
      await management.connect(bob).resign();
      await expect(management.idOf(bob.address)).to.be.revertedWith('Management: this account is not employeed here');
    });
  });
  describe('Payout', async function () {
    beforeEach(async function () {
      await management.connect(dev).feed({ value: AMOUNT });
      await management.connect(alice).employ(bob.address, SALARY);
      await management.connect(bob).payout();
    });
  });
});
