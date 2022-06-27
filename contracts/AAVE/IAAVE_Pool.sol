pragma solidity >=0.5.12;

/** 
 * @dev Interface for AAVE.com deposit contract for a generic pool.
 * @dev See original implementation in official repository:
 * https://github.com/
 */
interface IAAVE_Pool { 
    function supply(address asset, uint256 amount, address onBehalfOf, uint16 referralCode) external;
    function deposit(address asset, uint256 amount, address onBehalfOf, uint16 referralCode) external;
    function withdraw(address asset, uint256 amount, address to) external returns (uint256);
}