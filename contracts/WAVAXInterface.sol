pragma solidity >=0.5.0;

interface IWAVAX {
  function deposit() external payable; // Create WAVAX
  function transfer(address to, uint value) external returns (bool); // Send WAVAX
  function withdraw(uint256) external; // Burn WAVAX for AVAX
}
