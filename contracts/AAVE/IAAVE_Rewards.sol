pragma solidity ^0.8.0;

interface IAAVE_Rewards { 
    function claimRewardsToSelf(address[] calldata assets, uint256 amount, address reward) external returns(uint256);
    function getUserAccruedRewards(address user, address reward) external returns(uint256);
    //function claimRewards(address[] calldata assets, uint256 amount, address to, address reward) external returns(uint256);
    function claimRewards(address[] calldata assets, uint256 amount, address to, address reward) external returns (uint256);
}