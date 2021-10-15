pragma solidity ^0.5.0;

contract Owned {
    address public owner;
    mapping(address=>bool) subOwners;
    
    constructor() public {
        owner = msg.sender;
    }

    modifier onlySuperOwner{
       require(msg.sender == owner);
        _; 
    }
    modifier onlyOwner {
        require(msg.sender == owner || subOwners[msg.sender]);
        _;
    }

    function addSubOwner(address subOwner) public onlySuperOwner returns (bool success){
        subOwners[subOwner] = true;
        return true;
    }

    function  removeSubOwner(address subOwner) public onlySuperOwner returns (bool success){
        subOwners[subOwner] = false;
        return true; 
    }
    
    function isSubOwner(address subOwner) public view onlySuperOwner returns (bool success){
        return subOwners[subOwner];
    }

}