// SPDX-License-Identifier: MIT

pragma solidity ^0.8.6;

import "./Dao.sol";
import "@openzeppelin/contracts/utils/Address.sol";

/// @dev Management contract is used to manage employees and there salary is a specific Dao

contract Management {
    using Address for address payable;
    uint256 public constant INTERVAL = 1 weeks;
    struct Employee {
        address account;
        uint256 salary;
        uint256 employedAt;
        uint256 lastPayout;
    }

    event Received(address sender, uint256 amount);
    event Withdrew(address receiver, uint256 amount);
    event Employed(uint256 id, address account, uint256 salary);
    event Fired(uint256 id, address account);
    event Resigned(uint256 id, address account);
    event Payed(address account, uint256 amount, uint256 nbPayout, uint256 timestamp);

    Dao private _dao;
    mapping(address => uint256) private _employeesId;
    mapping(uint256 => Employee) private _employeesData;
    uint256 private _counter;

    /// @dev msg.sender is the Dao contract who deploy this one
    constructor() {
        _dao = Dao(msg.sender);
    }

    /// @dev feed contract with ethers as msg.value

    function feed() public payable {
        emit Received(msg.sender, msg.value);
    }

    /// @dev mananager can employ any address and set a salary
    /// @param account_ who will be employed
    /// @param salary_ for this account

    function employ(address account_, uint256 salary_) public returns (bool) {
        require(_dao.hasRole(_dao.MANAGER_ROLE(), msg.sender), "Management: only Manager Role can use this function");
        require(account_ != msg.sender, "Management: cannot employ yourself");
        _counter++;
        _employeesId[account_] = _counter;
        _employeesData[_counter] = Employee({
            account: account_,
            salary: salary_,
            employedAt: block.timestamp,
            lastPayout: 0
        });
        emit Employed(_counter, account_, salary_);
        return true;
    }

    /// @dev manager can unemploy a curent employee
    /// @param account who will loose his salary

    function fire(address account) public returns (bool) {
        require(_dao.hasRole(_dao.MANAGER_ROLE(), msg.sender), "Management: only Manager Role can use this function");
        _employeesData[idOf(account)] = Employee({account: address(0), salary: 0, employedAt: 0, lastPayout: 0});
        _employeesId[account] = 0;
        emit Fired(idOf(account), account);
        return true;
    }

    /// @dev a user can resign from his job

    function resign() public returns (bool) {
        _employeesData[idOf(msg.sender)] = Employee({account: address(0), salary: 0, employedAt: 0, lastPayout: 0});
        _employeesId[msg.sender] = 0;
        emit Resigned(idOf(msg.sender), msg.sender);
        return true;
    }

    /// @dev employed user can use this function to receive there current salary

    function payout() public returns (bool) {
        require(lastPayoutOf(msg.sender) < block.timestamp);
        uint256 timestamp = block.timestamp;
        uint256 nbPayout = timestamp - lastPayoutOf(msg.sender) / INTERVAL;
        uint256 amount = salaryOf(msg.sender) * nbPayout;
        _employeesData[idOf(msg.sender)].lastPayout = timestamp;
        payable(msg.sender).sendValue(amount);
        emit Payed(msg.sender, amount, nbPayout, timestamp);
        return true;
    }

    /// @dev admin can withdraw ethers from this contract
    /// @param amount who will be withdrew

    function withdraw(uint256 amount) public returns (bool) {
        require(_dao.hasRole(_dao.ADMIN_ROLE(), msg.sender), "Management: only Admin Role can use this function");
        require(address(this).balance >= amount, "Management: cannot withdraw more than total treasury");
        payable(msg.sender).sendValue(amount);
        emit Withdrew(msg.sender, amount);
        return true;
    }

    /// @dev admin can withdraw all ethers from this contract

    function withdrawAll() public returns (bool) {
        require(_dao.hasRole(_dao.ADMIN_ROLE(), msg.sender), "Management: only Admin Role can use this function");
        uint256 amount = address(this).balance;
        payable(msg.sender).sendValue(amount);
        emit Withdrew(msg.sender, amount);
        return true;
    }

    /// @param account that we want his id
    /// @return id of this account

    function idOf(address account) public view returns (uint256) {
        require(_employeesId[account] != 0, "Management: this account is not employeed here");
        return _employeesId[account];
    }

    /// @param account that we want his salary
    /// @return salary of this account

    function salaryOf(address account) public view returns (uint256) {
        return _employeesData[idOf(account)].salary;
    }

    /// @param account that we want his employement timestamp
    /// @return employment timestamp of this account

    function employmentOf(address account) public view returns (uint256) {
        return _employeesData[idOf(account)].employedAt;
    }

    /// @param account that we want his last payout timestamp
    /// @return last payout timestamp of this account
    
    function lastPayoutOf(address account) public view returns (uint256) {
        return _employeesData[idOf(account)].lastPayout;
    }
}
