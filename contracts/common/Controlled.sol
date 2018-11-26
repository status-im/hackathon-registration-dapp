pragma solidity ^0.4.23;

contract Controlled {

    mapping(address => bool) public controllers;

    /// @notice The address of the controller is the only address that can call
    ///  a function with this modifier
    modifier onlyController { 
        require(controllers[msg.sender]); 
        _; 
    }

    address public controller;

    constructor() internal { 
        controllers[msg.sender] = true; 
        controller = msg.sender;
    }

    /// @notice Changes the controller of the contract
    /// @param _newController The new controller of the contract
    function changeController(address _newController) public onlyController {
        controller = _newController;
    }

    function changeControllerAccess(address _controller, bool _access) public onlyController {
        controllers[_controller] = _access;
    }

}
