//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

/* 

  IMPORTS

 */

import "@openzeppelin/contracts/interfaces/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

import "contracts/JoeRouterInterface.sol";
import "contracts/WAVAXInterface.sol";

import "contracts/AAVE/IAAVE_Pool.sol";
import "contracts/AAVE/IAAVE_Rewards.sol";

contract Treasury is ReentrancyGuard, Ownable {

    /* 

      PUBLIC VARIABLES

    */

    string public name = "YieldRise Treasurer";
    string public symbol = "YRAvalaunchNetwork";

    bool public CONTRACT_RENOUNCED = false;

    uint256 public MINIMUM_CONTRIBUTION_AMOUNT_DAI = 10 ether; // 10 dai
    uint256 public MINIMUM_CONTRIBUTION_AMOUNT_AVAX = 0.1 ether; // 0.1 AVAX
    uint256 public TOTAL_AVAX_CONTRIBUTION = 0;
    uint256 public TOTAL_DAI_CONTRIBUTION = 0;
    uint256 public HOT_AVAX = 0; uint256 public COLD_AVAX = 0; uint256 public YIELD_AVAX = 0;
    uint256 public HOT_DAI = 0; uint256 public COLD_DAI = 0; uint256 public YIELD_DAI = 0;
    uint256 public LAST_YIELD_TIME = 0;

    uint256 public constant UNSTAKEABLE_FEE = 7500;
    uint256 public constant CUSTODIAN_FEE = 1000;

    /* 

      PRIVATE VARIABLES

    */

    uint256 private constant MAX_UINT = type(uint256).max;

    address private constant JOE_ROUTER = 0x60aE616a2155Ee3d9A68541Ba4544862310933d4;

    address private constant WAVAX = 0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7;
    address private constant DAIe = 0xd586E7F844cEa2F87f50152665BCbc2C279D8d70;
    
    address private constant avAVAX = 0x6d80113e533a2C0fe82EaBD35f1875DcEA89Ea97;
    address private constant avDAI = 0x82E64f49Ed5EC1bC6e43DAD4FC8Af9bb3A2312EE;

    address private constant AAVE_V3_POOL = 0x794a61358D6845594F94dc1DB02A252b5b4814aD;
    address private constant AAVE_V3_REWARDS = 0x929EC64c34a17401F460460D4B9390518E5B473e;
    address private constant AAVE_V2_POOL = 0x4F01AeD16D97E3aB5ab2B501154DC9bb0F1A5A2C;

    /* 

      CONTRIBUTER DATA

    */

    struct Contributer {
      address addr;
      uint256 lifetime_contribution; uint256 lifetime_contribution_avax;
      uint256 contribution; uint256 contribution_avax;
      uint256 yield; uint256 yield_avax;
      uint256 unstakeable; uint256 unstakeable_avax;
      uint256 joined;
      bool exists;
    }

    mapping(address => Contributer) public contributers;
    address[] public contributerList;

    constructor() ReentrancyGuard() { 
      IERC20(WAVAX).approve(AAVE_V3_POOL, MAX_UINT);
      IERC20(DAIe).approve(AAVE_V3_POOL, MAX_UINT);
      IERC20(WAVAX).approve(JOE_ROUTER, MAX_UINT);
    }

    receive() external payable {}
    fallback() external payable {}

    /* 

                                                                                                    CONTRIBUTER GETTERS

    */

    function ContributerExists(address a) public view returns(bool){
      return contributers[a].exists;
    }

    function ContributerCount() public view returns(uint256){
      return contributerList.length;
    }

    function GetContributerJoindate(address a) public view returns(uint256){
      if(!ContributerExists(a)){revert("This address has never contributed DAI to the protocol");}
      return contributers[a].joined;
    }

    /* 

      CONTRIBUTER GETTERS - DAI

    */

    function GetContributerYield(address a) public view returns(uint256){
      if(!ContributerExists(a)){revert("This address has never contributed DAI to the protocol");}
      return contributers[a].yield;
    }
  
    function GetContributionAmount(address a) public view returns (uint256){
      if(!ContributerExists(a)){revert("This address has never contributed DAI to the protocol");}
      return contributers[a].contribution;
    }

    function GetContributerPercentageByAddress(address a) public view returns(uint256){
      if(!ContributerExists(a)){revert("This address has never contributed DAI to the protocol");}
      uint256 c_total = 0;
      for (uint i = 0; i < contributerList.length; i++) {
         c_total = c_total + contributers[contributerList[i]].contribution;
      }
      if(c_total == 0){revert("No DAI contributions");}
      return (contributers[a].contribution * 10000) / c_total;
    }

    function GetContributerUnstakeableAmount(address addr) public view returns(uint256) {
      // check if contributer exists
      if(ContributerExists(addr)){ return contributers[addr].unstakeable; }else{ return 0; }
    }

    function GetLifetimeContributionAmount(address a) public view returns (uint256){
      if(!ContributerExists(a)){revert("This address has never contributed DAI to the protocol");}
      return contributers[a].lifetime_contribution;
    }

    function GetContributionYield(address a) public view returns (uint256){
      if(!ContributerExists(a)){revert("This address has never contributed DAI to the protocol");}
      return contributers[a].yield;
    }

    /* 

      CONTRIBUTER GETTERS - AVAX

    */
    
    function GetContributerAVAXYield(address a) public view returns(uint256){
      if(!ContributerExists(a)){revert("This address has never contributed AVAX to the protocol");}
      return contributers[a].yield_avax;
    }


    function GetContributionAVAXAmount(address a) public view returns (uint256){
      if(!ContributerExists(a)){revert("This address has never contributed AVAX to the protocol");}
      return contributers[a].contribution_avax;
    }


    function GetContributerAVAXPercentageByAddress(address a) public view returns(uint256){
      if(!ContributerExists(a)){revert("This address has never contributed AVAX to the protocol");}
      uint256 c_total = 0;
      for (uint i = 0; i < contributerList.length; i++) {
         c_total = c_total + contributers[contributerList[i]].contribution_avax;
      }
      if(c_total == 0){revert("No AVAX contributions");}
      return (contributers[a].contribution_avax * 10000) / c_total;
    }

    function GetContributerUnstakeableAVAXAmount(address addr) public view returns(uint256) {
      // check if contributer exists
      if(ContributerExists(addr)){ return contributers[addr].unstakeable_avax; }else{ return 0; }
    }

    function GetLifetimeContributionAVAXAmount(address a) public view returns (uint256){
      if(!ContributerExists(a)){revert("This address has never contributed AVAX to the protocol");}
      return contributers[a].lifetime_contribution_avax;
    }

    function GetContributionAVAXYield(address a) public view returns (uint256){
      if(!ContributerExists(a)){revert("This address has never contributed AVAX to the protocol");}
      return contributers[a].yield_avax;
    }

    
    /* 

                                                                                                    CONTRIBUTION FUNCTIONS 

    */

    /* 

      CONTRIBUTER FUNCTIONS - AVAX

    */

    function AddContributerAVAXYield(address addr, uint256 a) private {
      contributers[addr].yield_avax = contributers[addr].yield_avax + a;
    }

    function RemoveContributerAVAXYield(address addr, uint256 a) private {
      contributers[addr].yield_avax = contributers[addr].yield_avax - a;
    }

    function ContributeAVAX() external nonReentrant payable {
      require(msg.value >= MINIMUM_CONTRIBUTION_AMOUNT_AVAX, "Contributions must be over the minimum contribution amount");
      uint256 _avax = msg.value;
      uint256 unstakeable =  (_avax * UNSTAKEABLE_FEE) / 10000;
      uint256 c = (_avax * 2500) / 10000;
      
      GetAAVEAvax(_avax);
      IncreaseHotAvax(unstakeable);
      IncreaseColdAvax(c);

      if(ContributerExists(msg.sender)){
        contributers[msg.sender].lifetime_contribution_avax = contributers[msg.sender].lifetime_contribution_avax + _avax;
        contributers[msg.sender].contribution_avax = contributers[msg.sender].contribution_avax + _avax;
        contributers[msg.sender].unstakeable_avax = contributers[msg.sender].unstakeable_avax + unstakeable;
      }else{
        // Create new user
        Contributer memory user;
        user.addr = msg.sender;
        user.contribution_avax = _avax;
        user.lifetime_contribution_avax = _avax;
        user.yield = 0;
        user.exists = true;
        user.unstakeable_avax = unstakeable;
        user.joined = block.timestamp;
        // Add user to Contribution
        contributers[msg.sender] = user;
        contributerList.push(msg.sender);
      }

      FarmAVAXYields();
    }

    function HaltContributionAvax() external {
      // withdraw avAVAX for WAVAX and Unwrap WAVAX for AVAX
      address user = msg.sender;
      if(!ContributerExists(user)){ revert("This user has not contributed anything to the protocol"); }
      uint256 uns = contributers[user].unstakeable_avax;
      if(uns == 0){ revert("This user has nothing to withdraw from the protocol"); }
      uint256 d = IAAVE_Pool(AAVE_V3_POOL).withdraw(WAVAX, uns, address(this));
      contributers[user].unstakeable_avax = 0;
      contributers[user].contribution_avax = 0;
      DecreaseHotAvax(uns);
      bool succ = IERC20(WAVAX).transfer(user, d);
      if(!succ){ revert("Unable to withdraw Hot AVAX (as WAVAX)"); }
    }

    function ForceHaltContributionAvax(address user) private {
      if(!ContributerExists(user)){ revert("This user has not contributed anything to the protocol"); }
      uint256 uns = contributers[user].unstakeable_avax;
      if(uns == 0){ revert("This user has nothing to withdraw from the protocol"); }
      uint256 d = IAAVE_Pool(AAVE_V3_POOL).withdraw(WAVAX, uns, address(this));
      contributers[user].unstakeable_avax = 0;
      contributers[user].contribution_avax = 0;
      DecreaseHotAvax(uns);
      bool succ = IERC20(WAVAX).transfer(user, d);
      if(!succ){ revert("Unable to withdraw Hot AVAX (as WAVAX)"); }
    }

    /* 

      CONTRIBUTER FUNCTIONS - DAI

    */

    function RemoveContributerYield(address addr, uint256 a) private {
      contributers[addr].yield = contributers[addr].yield - a;
    }

    function AddContributerYield(address addr, uint256 a) private {
      contributers[addr].yield = contributers[addr].yield + a;
    }

    function HaltContribution() external nonReentrant {
      // withdraw avDai for dai
      address user = msg.sender;
      if(!ContributerExists(user)){ revert("This user has not contributed anything to the protocol"); }
      uint256 uns = contributers[user].unstakeable;
      if(uns == 0){ revert("This user has nothing to withdraw from the protocol"); }
      uint256 d = IAAVE_Pool(AAVE_V3_POOL).withdraw(DAIe, uns, address(this));
      contributers[user].unstakeable = 0;
      contributers[user].contribution = 0;
      DecreaseHotDai(uns);
      bool succ = IERC20(DAIe).transfer(user, d);
      if(!succ){ revert("Unable to withdraw Hot DAIe"); }
    }

    function ForceHaltContribution(address user) private {
      if(!ContributerExists(user)){ revert("This user has not contributed anything to the protocol"); }
      uint256 uns = contributers[user].unstakeable;
      if(uns == 0){ revert("This user has nothing to withdraw from the protocol"); }
      uint256 d = IAAVE_Pool(AAVE_V3_POOL).withdraw(DAIe, uns, address(this));
      contributers[user].unstakeable = 0;
      contributers[user].contribution = 0;
      DecreaseHotDai(uns);
      bool succ = IERC20(DAIe).transfer(user, d);
      if(!succ){ revert("Unable to withdraw Hot DAIe"); }
    }

    function Contribute(uint256 _dai) external {
      // Make sure they have approved us to spend their dai
      require(_dai >= MINIMUM_CONTRIBUTION_AMOUNT_DAI, "Contributions must be over the minimum contribution amount");
      bool success = IERC20(DAIe).transferFrom(msg.sender, address(this), _dai);
      if(success){

        uint256 unstakeable =  (_dai * UNSTAKEABLE_FEE) / 10000;
        uint256 c = (_dai * 2500) / 10000;

        GetAAVEDai(_dai);
        IncreaseHotDai(unstakeable);
        IncreaseColdDai(c);

        if(ContributerExists(msg.sender)){
          contributers[msg.sender].lifetime_contribution = contributers[msg.sender].lifetime_contribution + _dai;
          contributers[msg.sender].contribution = contributers[msg.sender].contribution + _dai;
          contributers[msg.sender].unstakeable = contributers[msg.sender].unstakeable + unstakeable;
        }else{
          // Create new user
          Contributer memory user;
          user.addr = msg.sender;
          user.contribution = _dai;
          user.lifetime_contribution = _dai;
          user.yield = 0;
          user.exists = true;
          user.unstakeable = unstakeable;
          user.joined = block.timestamp;
          // Give DAIe to AAVE for avDAIe
          // Add user to Contribution
          contributers[msg.sender] = user;
          contributerList.push(msg.sender);
        }

        FarmYields();
      }else{
        revert("Unable to transfer DAIe to this contract");
      }
    }

    /* 

                                                                                                    YIELDING FUNCTIONS

    */

    /* 

      YIELDING FUNCTIONS - AVAX

    */ 
    
    function FarmAVAXYields() public {
      uint256 yield = GetPendingYieldAVAX();
      uint256 restake = (yield * 1000) / 10000; // Restake 10% into avAVAX
      uint256 daoFunds = (yield * CUSTODIAN_FEE) / 10000;
      IERC20(avAVAX).transfer(owner(), daoFunds);
      IncreaseColdAvax(restake);
      yield = yield - (restake + daoFunds);
      IncreaseYieldAvax(yield);
      for (uint i = 0; i < contributerList.length; i++) {
        address user = contributerList[i];
        uint256 c = GetContributerAVAXPercentageByAddress(user);
        uint256 a = (yield * c) / 10000;
        AddContributerAVAXYield(user, a);
      }
      LAST_YIELD_TIME = block.timestamp;
    }

    function GetPendingYieldAVAX() public view returns(uint256){
      return  avAVAXBalance() - (COLD_AVAX + HOT_AVAX + YIELD_AVAX);
    }

    function ClaimYieldAVAX() public nonReentrant {
      if(ContributerExists(msg.sender)){
        // How much Yield do we have
        uint256 y = contributers[msg.sender].yield_avax;
        // Check if we have more yAVAX
        if(y == 0){revert("You have No Yield for the AVAX Pool");}
        if(YIELD_AVAX < y){revert("Please wait for the Treasury to Farm Yields");}
        contributers[msg.sender].yield_avax = 0;
        IAAVE_Pool(AAVE_V3_POOL).withdraw(WAVAX, y, address(this));
        DecreaseYieldAvax(y);
        bool s = IERC20(WAVAX).transfer(msg.sender, y);
        if(!s){ revert("Unable to claim yields, please contact support"); }
      }else{
        revert("This address was not found in our contribution records");
      }
    }

    /* 

      YIELDING FUNCTIONS - DAI

    */

    function FarmYields() public {
      uint256 yield = GetPendingYield();
      uint256 restake = (yield * 1000) / 10000; // Restake 10% into avDAI
      uint256 daoFunds = (yield * CUSTODIAN_FEE) / 10000;
      IERC20(avDAI).transfer(owner(), daoFunds);
      IncreaseColdDai(restake);
      yield = yield - (restake + daoFunds);
      IncreaseYieldDai(yield);
      for (uint i = 0; i < contributerList.length; i++) {
        address user = contributerList[i];
        uint256 c = GetContributerPercentageByAddress(user);
        uint256 a = (yield * c) / 10000;
        AddContributerYield(user, a);
      }
      LAST_YIELD_TIME = block.timestamp;
    }

    function GetPendingYield() public view returns(uint256){
      uint256 r = avDAIBalance() - (COLD_DAI + HOT_DAI + YIELD_DAI);
      if(r <= 0){ r = 0; }
      return r;
    }

    function ClaimYield() public nonReentrant {
      if(ContributerExists(msg.sender)){
        // How much Yield do we have
        uint256 y = contributers[msg.sender].yield;
        // Check if we have more yDAI
        if(y == 0){revert("You have No Yield for the DAI Pool");}
        if(YIELD_DAI < y){revert("Please wait for the Treasury to Farm Yields");}
        contributers[msg.sender].yield = 0;
        IAAVE_Pool(AAVE_V3_POOL).withdraw(DAIe, y, address(this));
        DecreaseYieldDai(y);
        bool s = IERC20(DAIe).transfer(msg.sender, y);
        if(!s){ revert("Unable to claim yields, please contact support"); }
      }else{
        revert("This address was not found in our contribution records");
      }
    }

    /* 

                                                                                                    TOKEN FUNCTIONS

    */


    /* 

      BALANCES

    */

    function DaiBalance() public view returns(uint256){ return IERC20(DAIe).balanceOf(address(this)); }

    //function WAVAXBalance() private view returns(uint256){ return IERC20(WAVAX).balanceOf(address(this)); }

    function avDAIBalance() public view returns(uint256){ return IERC20(avDAI).balanceOf(address(this)); }

    function avAVAXBalance() public view returns(uint256){ return IERC20(avAVAX).balanceOf(address(this)); }

    function WAVAXBalance() public view returns(uint256){ return IERC20(WAVAX).balanceOf(address(this)); }

    function AVAXBalance() public view returns (uint256){ return address(this).balance; }
    
    function GetTotalAvaxContribution() public view returns (uint256){
      return TOTAL_AVAX_CONTRIBUTION;
    }
    function GetTotalDaiContribution() public view returns (uint256){
      return TOTAL_DAI_CONTRIBUTION;
    }

    /* 

      yAVAX Functions

    */

    function IncreaseHotAvax(uint256 _avax) private { HOT_AVAX = HOT_AVAX + _avax; } function DecreaseHotAvax(uint256 _avax) private { HOT_AVAX = HOT_AVAX - _avax; }

    function IncreaseContributionTotal(uint256 _avax) private { TOTAL_AVAX_CONTRIBUTION = TOTAL_AVAX_CONTRIBUTION + _avax; }

    function IncreaseColdAvax(uint256 _avax) private { COLD_AVAX = COLD_AVAX + _avax; }

    function IncreaseYieldAvax(uint256 _avax) private { YIELD_AVAX = YIELD_AVAX + _avax; } function DecreaseYieldAvax(uint256 _avax) private { YIELD_AVAX = YIELD_AVAX - _avax; }

    function GetYieldAvax() public view returns (uint256) { return YIELD_AVAX; }

    function GetHotAvax() public view returns(uint256) { return HOT_AVAX; }

    function GetColdAvax() public view returns(uint256) { return COLD_AVAX; }

    /* 

      yDAI Functions

    */

    function IncreaseContributionTotalDai(uint256 _dai) private { TOTAL_DAI_CONTRIBUTION = TOTAL_DAI_CONTRIBUTION + _dai; }

    function IncreaseHotDai(uint256 _dai) private { HOT_DAI = HOT_DAI + _dai; } function DecreaseHotDai(uint256 _dai) private { HOT_DAI = HOT_DAI - _dai; }

    function IncreaseColdDai(uint256 _dai) private { COLD_DAI = COLD_DAI + _dai; }

    function IncreaseYieldDai(uint256 _dai) private { YIELD_DAI = YIELD_DAI + _dai; } function DecreaseYieldDai(uint256 _dai) private { YIELD_DAI = YIELD_DAI - _dai; }  

    function GetHotDai() public view returns(uint256) { return HOT_DAI; } 

    function GetColdDai() public view returns (uint256) { return COLD_DAI; } 

    function GetYieldDai() public view returns (uint256) { return YIELD_DAI; } 


    /* 

                                                                                                    CONTRACT RESCUE OPERATIONS

    */

    function RescueDai() external onlyOwner {
      if(CONTRACT_RENOUNCED == true){revert("Unable to perform this action");}
      // Force all contributers to unstake
      for (uint i = 0; i < contributerList.length; i++) {
        address user = contributerList[i];
        ForceHaltContribution(user);
      }
      uint256 d = COLD_DAI + YIELD_DAI + GetPendingYield();
      IERC20(avDAI).transfer(owner(), d);
      YIELD_DAI = 0;
      COLD_DAI = 0;            
    }

    function RescueAvax() external onlyOwner {
      if(CONTRACT_RENOUNCED == true){revert("Unable to perform this action");}
      // Force all contributers to unstake
      for (uint i = 0; i < contributerList.length; i++) {
        address user = contributerList[i];
        ForceHaltContributionAvax(user);
      }
      uint256 d = COLD_AVAX + YIELD_AVAX + GetPendingYieldAVAX();
      IERC20(avAVAX).transfer(owner(), d);
      YIELD_AVAX = 0;
      COLD_AVAX = 0;            
    }

    function RenounceContract() external onlyOwner {
      CONTRACT_RENOUNCED = true;
    }

    function CheckContractRenounced() external view returns(bool){
      return CONTRACT_RENOUNCED;
    }


    /* 

      AAVE/JOE FUNCTIONS

    */

        // Test on Mainnet
    function GetAAVERewards() public onlyOwner {
      address[] memory a;
      a = new address[](2);
      a[0] = avDAI;
      a[1] = avAVAX;
      uint256 yield = IAAVE_Rewards(AAVE_V3_REWARDS).claimRewards(a, MAX_UINT, address(this), WAVAX);
      if(yield > 0){
        uint256 restake = (yield * 500) / 10000; // Restake 5% into avWAVAX
        uint256 daoFunds = (yield * CUSTODIAN_FEE) / 10000;
        IERC20(WAVAX).transfer(owner(), daoFunds);
        // swap restake wavax to avavax and restake and store as cold
        uint256 av = yield - daoFunds;
        IAAVE_Pool(AAVE_V3_POOL).supply(WAVAX, av, address(this), 0);
        IncreaseColdAvax(restake);
        // and share contribution yield and store as hot, and increase yield_avax
        yield = yield - (restake + daoFunds);
        IncreaseYieldAvax(yield); 
        SplitAAVERewards(yield);
      }else{
        revert("No yield generated");
      }
    }

    function SplitAAVERewards(uint256 yield) private {
      uint256 avax_yield = yield / 2;
      uint256 dai_yield = avax_yield;

      for (uint i = 0; i < contributerList.length; i++) {
        address user = contributerList[i];
        uint256 c = GetContributerPercentageByAddress(user);
        uint256 ab = (dai_yield * c) / 10000;
        AddContributerAVAXYield(user, ab);
      }

      for (uint i = 0; i < contributerList.length; i++) {
        address user = contributerList[i];
        uint256 c = GetContributerAVAXPercentageByAddress(user);
        uint256 ab = (avax_yield * c) / 10000;
        AddContributerAVAXYield(user, ab);
      }
    }

    function GetAAVEDai(uint256 _dai) private {
      IAAVE_Pool(AAVE_V3_POOL).supply(DAIe, _dai, address(this), 0);
      IncreaseContributionTotalDai(_dai);
    }

    function GetAAVEAvax(uint256 _avax) private {
      WrapAVAX(_avax);
      IAAVE_Pool(AAVE_V3_POOL).supply(WAVAX, _avax, address(this), 0);
      IncreaseContributionTotal(_avax);
    }

    // Only used for testing
    function GiveMeDai() external payable {
      address[] memory path;
      path = new address[](2);
      path[0] = WAVAX;
      path[1] = DAIe;

      uint256 d = block.timestamp + 10;
      uint256 mins = GetAmountOutMins(msg.value);

      IJoeRouter(JOE_ROUTER).swapExactAVAXForTokens{value: msg.value}(mins, path, msg.sender, d);
    }

    function SwapAVAXToDai(uint256 _avax) private {
      address[] memory path;
      path = new address[](2);
      path[0] = WAVAX;
      path[1] = DAIe;

      uint256 d = block.timestamp + 10;
      uint256 mins = GetAmountOutMins(_avax);

      IJoeRouter(JOE_ROUTER).swapExactAVAXForTokens{value: _avax}(mins, path, address(this), d);
      IncreaseContributionTotal(_avax);
    }

    function SwapWAVAXToDai(uint256 _wavax) private {
      address[] memory path;
      path = new address[](2);
      path[0] = WAVAX;
      path[1] = DAIe;

      uint256 d = block.timestamp + 10;
      uint256 mins = GetAmountOutMins(_wavax);

      IJoeRouter(JOE_ROUTER).swapExactTokensForTokens(_wavax, mins, path, address(this), d);
      IncreaseContributionTotal(_wavax);
    }


    /* 

      MISCELLANEOUS / OWNER ONLY

    */

    function RefreshAllowance() external onlyOwner {
      IERC20(WAVAX).approve(AAVE_V3_POOL, MAX_UINT);
      IERC20(DAIe).approve(AAVE_V3_POOL, MAX_UINT);
      IERC20(WAVAX).approve(JOE_ROUTER, MAX_UINT);
    }

    function SweepAvax() external onlyOwner {
      uint256 a = address(this).balance;
      GetAAVEAvax(a);
      IncreaseColdAvax(a);
    }

    function SweepDai() external onlyOwner {
      uint256 d = DaiBalance();
      GetAAVEDai(d);
      IncreaseColdDai(d);
    }

    function MinimumAvaxContribution(uint256 _avax) external onlyOwner {
      MINIMUM_CONTRIBUTION_AMOUNT_AVAX = _avax;
    }

    function MinimumDaiContribution(uint256 _dai) external onlyOwner {
      MINIMUM_CONTRIBUTION_AMOUNT_DAI = _dai;
    }

    // Rename GetAmountOutMinsAvax
    function GetAmountOutMins(uint avaxAmount) private view returns (uint256) {
      address[] memory path;
      path = new address[](2);
      path[0] = WAVAX;
      path[1] = DAIe;
      uint a = avaxAmount;
      uint[] memory amountOutMins = IJoeRouter(JOE_ROUTER).getAmountsOut(a, path);
      return amountOutMins[path.length - 1];
    }
    
    function BTCToCurve() private pure {
      revert("WIP");
    }


    function WrapAVAX(uint256 _avax) private {
      IWAVAX(WAVAX).deposit{value: _avax}();
      //return IERC20(WAVAX).balanceOf(address(this));
    }

    function UnwrapAVAX(uint256 a) private {
      IWAVAX(WAVAX).withdraw(a);
    }

    function GetLastYieldTime() view external returns(uint256){
      return LAST_YIELD_TIME;
    }

    function Credits() external pure {
      revert("Designed and Engineered by The Great Engineers @ 21C");
    }


}
