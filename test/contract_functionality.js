const { expect } = require("chai");
const { BigNumber, Wallet } = require("ethers");
const { ethers } = require("hardhat");

const OneDay = 24 * 60 * 60;
const OneWeek = 7 * 24 * 60 * 60;
const OneMonth = 4 * 7 * 24 * 60 * 60;
const SixMonths = 6 * 4 * 7 * 24 * 60 * 60;

let TreasuryContract, owner, wallet1, wallet2, wallet3;
let OneAvax = ethers.utils.parseEther("1");
let TwoFiveAvax = ethers.utils.parseEther("2.5");
let FiveAvax = ethers.utils.parseEther("5");
let TenAvax = ethers.utils.parseEther("10");
let TwelveFiveAvax = ethers.utils.parseEther("12.5");
let TwentyFiveAvax = ethers.utils.parseEther("25");
let FiftyAvax = ethers.utils.parseEther("50");
let HundreadDai = ethers.utils.parseEther("100");
let ThousandAvax = ethers.utils.parseEther("1000");
let TwoThoundsandFiveDai = ethers.utils.parseEther("2500");
let FiveThousandDai = ethers.utils.parseEther("5000");
let TenThousandDai = ethers.utils.parseEther("10000");
let TenThousandAvax = ethers.utils.parseEther("10000");
let FifteenThousandDai = ethers.utils.parseEther("15000");
let MAXDai = ethers.utils.parseEther("10000000000000000000000");

const abi = [
  "function balanceOf(address owner) view returns (uint256)",
  "function approve(address spender, uint256 amount) public returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
];
const daiAddr = "0xd586E7F844cEa2F87f50152665BCbc2C279D8d70";
const wavaxAddr = "0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7";

function Unstakeable(a) {
  return (a * 7500) / 10000;
}

beforeEach(async () => {
  // Deploy Contracts before we start tests
  treasuryContract = await ethers.getContractFactory("Treasury");
  TreasuryContract = await treasuryContract.deploy();
  [owner, wallet1, wallet2, wallet3, wallet4, wallet5] =
    await ethers.getSigners();
});

// Prices of AVAX/DAI for testing may have varied

describe("YIELDRISE Treasury Contract Contribution Functionality (DAI)", function () {
  it("Should push a new contributer (DAI)", async function () {
    await TreasuryContract.GiveMeDai({ value: ThousandAvax });
    const DAIe = new ethers.Contract(daiAddr, abi, owner);
    await DAIe.approve(TreasuryContract.address, MAXDai); // Should be MAX
    await TreasuryContract.Contribute(TenThousandDai);
    let a = ethers.utils.formatEther(
      await TreasuryContract.GetTotalDaiContribution()
    );
    expect(Number(a)).to.equal(Number(10000));
    /*
    
    console.log(ethers.utils.formatEther(await TreasuryContract.HOT_DAI()));
    console.log(ethers.utils.formatEther(await TreasuryContract.COLD_DAI()));
    console.log(ethers.utils.formatEther(await TreasuryContract.YIELD_DAI()));
    console.log(ethers.utils.formatEther(await TreasuryContract.TOTAL_DAI_CONTRIBUTION()));
    console.log(ethers.utils.formatEther(await TreasuryContract.GetContributerYield(owner.address)));
    */
  });

  it("Should push new contributers (DAI)", async function () {
    const DAIe = new ethers.Contract(daiAddr, abi, owner);
    await DAIe.approve(TreasuryContract.address, MAXDai); // Should be MAX
    await TreasuryContract.GiveMeDai({ value: ThousandAvax });
    await TreasuryContract.Contribute(TenThousandDai);

    let temporaryContract = TreasuryContract.connect(wallet1);
    const DAIe_Two = new ethers.Contract(daiAddr, abi, wallet1);
    await DAIe_Two.approve(TreasuryContract.address, MAXDai); // Should be MAX
    await temporaryContract.GiveMeDai({ value: ThousandAvax });
    await temporaryContract.Contribute(FifteenThousandDai);

    let a = ethers.utils.formatEther(
      await TreasuryContract.GetTotalDaiContribution()
    );
    expect(Number(a)).to.equal(Number(25000));
  });

  it("Should calculate contributer percentages (DAI)", async function () {
    const DAIe = new ethers.Contract(daiAddr, abi, owner);
    await DAIe.approve(TreasuryContract.address, MAXDai); // Should be MAX
    await TreasuryContract.GiveMeDai({ value: ThousandAvax });
    await TreasuryContract.Contribute(TenThousandDai);

    let temporaryContract = TreasuryContract.connect(wallet1);
    const DAIe_Two = new ethers.Contract(daiAddr, abi, wallet1);
    await DAIe_Two.approve(TreasuryContract.address, MAXDai); // Should be MAX
    await temporaryContract.GiveMeDai({ value: ThousandAvax });
    let a = ethers.utils.parseEther("25000");
    await temporaryContract.Contribute(a);

    let result = await TreasuryContract.GetContributerPercentageByAddress(
      owner.address
    );
    expect(result / 100).to.equal(28.57); //1 is 28.57% of 3.5
  });

  it("Should calculate 75% Unstakeable amount (DAI)", async function () {
    const DAIe = new ethers.Contract(daiAddr, abi, owner);
    await DAIe.approve(TreasuryContract.address, MAXDai); // Should be MAX
    await TreasuryContract.GiveMeDai({ value: ThousandAvax });
    await TreasuryContract.Contribute(TenThousandDai);
    let r = ethers.utils.formatEther(
      await TreasuryContract.GetContributerUnstakeableAmount(owner.address)
    );
    expect(Number(r)).to.equal(Number(7500));
  });

  it("Should Increase Total Contribution (DAI)", async function () {
    const DAIe = new ethers.Contract(daiAddr, abi, owner);
    const DAIe_One = new ethers.Contract(daiAddr, abi, wallet1);
    const DAIe_Two = new ethers.Contract(daiAddr, abi, wallet2);
    const DAIe_Three = new ethers.Contract(daiAddr, abi, wallet3);

    let tcOne = TreasuryContract.connect(wallet1);
    let tcTwo = TreasuryContract.connect(wallet2);
    let tcThree = TreasuryContract.connect(wallet3);

    await DAIe.approve(TreasuryContract.address, MAXDai);
    await TreasuryContract.GiveMeDai({ value: ThousandAvax });
    await TreasuryContract.Contribute(TenThousandDai); // 10,000

    await DAIe_One.approve(TreasuryContract.address, MAXDai);
    await tcOne.GiveMeDai({ value: ThousandAvax });
    await tcOne.Contribute(FiveThousandDai); // 15,000

    await DAIe_Two.approve(TreasuryContract.address, MAXDai);
    await tcTwo.GiveMeDai({ value: ThousandAvax });
    await tcTwo.Contribute(TwoThoundsandFiveDai); //  17,500

    await DAIe_Three.approve(TreasuryContract.address, MAXDai); // Should be MAX
    await tcThree.GiveMeDai({ value: ThousandAvax });
    await tcThree.Contribute(TwoThoundsandFiveDai); // 20,000

    await DAIe_Three.transfer(TreasuryContract.address, FiveThousandDai);
    await TreasuryContract.SweepDai();

    let b = ethers.utils.formatEther(
      await TreasuryContract.GetTotalDaiContribution()
    );
    expect(Number(b)).to.equal(Number(25000));
  });
});

describe("YIELDRISE Treasury Contract Contribution Functionality (AVAX)", function () {
  it("Should push a new contributer (AVAX)", async function () {
    await TreasuryContract.ContributeAVAX({ value: ThousandAvax });
    let a = ethers.utils.formatEther(
      await TreasuryContract.GetTotalAvaxContribution()
    );
    //console.log(ethers.utils.formatEther(await TreasuryContract.avAVAXBalance()));
    expect(Number(a)).to.equal(Number(1000));
    await ethers.provider.send("evm_increaseTime", [OneMonth]);
    await ethers.provider.send("evm_mine");
    //console.log(ethers.utils.formatEther(await TreasuryContract.avAVAXBalance()));
  });

  it("Should push new contributers (AVAX)", async function () {
    await TreasuryContract.ContributeAVAX({ value: FiftyAvax });

    let temporaryContract = TreasuryContract.connect(wallet1);
    await temporaryContract.ContributeAVAX({ value: FiftyAvax });

    let a = ethers.utils.formatEther(
      await TreasuryContract.GetTotalAvaxContribution()
    );
    expect(Number(a)).to.equal(Number(100));
  });

  it("Should calculate contributer pecentages (AVAX)", async function () {
    await TreasuryContract.ContributeAVAX({ value: OneAvax });

    let temporaryContract = TreasuryContract.connect(wallet1);
    await temporaryContract.ContributeAVAX({ value: TwoFiveAvax });

    let result = await TreasuryContract.GetContributerAVAXPercentageByAddress(
      owner.address
    );

    expect(result / 100).to.equal(28.57); //1 is 28.57% of 3.5
  });

  it("Should calculate 75% Unstakeable amount (AVAX)", async function () {
    await TreasuryContract.ContributeAVAX({ value: ThousandAvax });
    let r = ethers.utils.formatEther(
      await TreasuryContract.GetContributerUnstakeableAVAXAmount(owner.address)
    );
    expect(Number(r)).to.equal(Number(750));
  });

  it("Should Increase Total Contribution (AVAX)", async function () {
    let tcOne = TreasuryContract.connect(wallet1);
    let tcTwo = TreasuryContract.connect(wallet2);
    let tcThree = TreasuryContract.connect(wallet3);
    await TreasuryContract.ContributeAVAX({ value: FiftyAvax }); // 50
    await tcOne.ContributeAVAX({ value: TwentyFiveAvax }); // 75
    await tcTwo.ContributeAVAX({ value: TwelveFiveAvax });
    await tcThree.ContributeAVAX({ value: TwelveFiveAvax }); // 100
    await wallet1.sendTransaction({
      to: TreasuryContract.address,
      value: ethers.utils.parseEther("25.0"),
    });
    await TreasuryContract.SweepAvax();
    let a = ethers.utils.formatEther(
      await TreasuryContract.GetTotalAvaxContribution()
    );
    expect(Number(a)).to.equal(Number(125));
  });
  /*
  it("Should farm around 8% APY (AVAX)", async function () {
    await TreasuryContract.ContributeAVAX({ value: ThousandAvax });
    //let a = ethers.utils.formatEther(await TreasuryContract.WAVAXBalance());
    //console.log(a);
    console.log(ethers.utils.formatEther(await TreasuryContract.avAVAXBalance()));
    await ethers.provider.send('evm_increaseTime', [SixMonths]);
    await ethers.provider.send('evm_mine');
    console.log(ethers.utils.formatEther(await TreasuryContract.avAVAXBalance()));
    await TreasuryContract.GetAAVERewards();
    //let b = await TreasuryContract.TestA(); console.log(b);
    //let c = ethers.utils.formatEther(await TreasuryContract.WAVAXBalance());
    //console.log(c);
  });
  */
});

describe("YIELDRISE Treasury Contract Halt Contribution Functionality", function () {
  it("Should Manage to Withdraw Users Funds (DAIe)", async function () {
    const DAIe = new ethers.Contract(daiAddr, abi, owner);
    await DAIe.approve(TreasuryContract.address, MAXDai); // Should be MAX
    await TreasuryContract.GiveMeDai({ value: ThousandAvax });
    await TreasuryContract.Contribute(TenThousandDai);
    let x = ethers.utils.formatEther(await TreasuryContract.GetHotDai());
    let a = ethers.utils.formatEther(await DAIe.balanceOf(owner.address));

    //await TreasuryContract.Contribute({ value: TenAvax });
    await TreasuryContract.HaltContribution();
    let y = ethers.utils.formatEther(await TreasuryContract.GetHotDai());

    let b = ethers.utils.formatEther(await DAIe.balanceOf(owner.address));
    //await DAIe.balanceOf(owner.address));
    let c = Number(a) + Number(7500); // 7500 is 75% of TenThousandDai;

    //let r =
    //console.log(a); console.log(b); console.log(c);
    let d = ethers.utils.formatEther(
      await TreasuryContract.GetContributerUnstakeableAmount(owner.address)
    );
    expect(Number(b)).to.equal(c);
    expect(Number(d)).to.equal(Number(0));
    expect(Number(x)).to.equal(Number(7500));
    expect(Number(y)).to.equal(Number(0));
  });

  it("Should Manage to Withdraw Users Funds (WAVAX)", async function () {
    await TreasuryContract.ContributeAVAX({ value: FiftyAvax });
    let x = ethers.utils.formatEther(await TreasuryContract.GetHotAvax());
    let a = ethers.utils.formatEther(await owner.getBalance());

    //await TreasuryContract.Contribute({ value: TenAvax });
    await TreasuryContract.HaltContributionAvax();
    let y = ethers.utils.formatEther(await TreasuryContract.GetHotAvax());

    const WAVAX = new ethers.Contract(
      "0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7",
      abi,
      owner
    );
    let b = ethers.utils.formatEther(await WAVAX.balanceOf(owner.address));
    //await DAIe.balanceOf(owner.address));
    let c = Number(a) + Number(37.5); // 37.5 AVAX is 75% of 50 AVAX;

    //let r = ethers.utils.formatEther(await owner.getBalance());
    //console.log(a); console.log(b); console.log(c);
    let d = ethers.utils.formatEther(
      await TreasuryContract.GetContributerUnstakeableAVAXAmount(owner.address)
    );
    expect(Number(b)).to.equal(37.5);
    expect(Number(d)).to.equal(Number(0));
    expect(Number(x)).to.equal(Number(37.5));
    expect(Number(y)).to.equal(Number(0));
  });
});

describe("YIELDRISE Treasury Contract Rescue Operations", function () {
  it("Should Manage to Rescue All Staked Funds (DAIe)", async function () {
    const DAIe = new ethers.Contract(daiAddr, abi, owner);
    const avDAI = new ethers.Contract(
      "0x82E64f49Ed5EC1bC6e43DAD4FC8Af9bb3A2312EE",
      abi,
      owner
    );

    let temporaryContract = TreasuryContract.connect(wallet1);
    const DAIe_Two = new ethers.Contract(daiAddr, abi, wallet1);
    await DAIe_Two.approve(TreasuryContract.address, MAXDai); // Should be MAX
    await temporaryContract.GiveMeDai({ value: ThousandAvax });
    await temporaryContract.Contribute(TenThousandDai);

    let x = ethers.utils.formatEther(await TreasuryContract.GetColdDai());
    //console.log("Cold Dai Pre Rescue: " + x);
    await ethers.provider.send("evm_increaseTime", [SixMonths]);
    await ethers.provider.send("evm_mine");
    let y = ethers.utils.formatEther(await TreasuryContract.GetPendingYield());
    //console.log("Yield Dai Pre Rescue: " + y);
    let pre_bal = ethers.utils.formatEther(
      await DAIe.balanceOf(wallet1.address)
    );
    let o_pre_bal = ethers.utils.formatEther(
      await avDAI.balanceOf(owner.address)
    );
    await TreasuryContract.RescueDai();
    let c = Number(pre_bal) + Number(7500); // 7500 is 75% of TenThousandDai;
    let cur_bal = ethers.utils.formatEther(
      await DAIe.balanceOf(wallet1.address)
    );
    let o_cur_bal = ethers.utils.formatEther(
      await avDAI.balanceOf(owner.address)
    );
    //console.log("wallet1 pre balance - " + pre_bal);
    //console.log("wallet1 post balance prediction - " + c);
    //console.log("wallet1 current balance - " + Number(cur_bal));
    //console.log("owner pre avDai balance - " + o_pre_bal);
    //console.log("owner post avDai balance - " + o_cur_bal);
    let a = ethers.utils.formatEther(await TreasuryContract.GetColdDai());
    let b = ethers.utils.formatEther(await TreasuryContract.GetYieldDai());
    //console.log("Cold Dai Post Rescue: " + a);
    //console.log("Yield Dai Post Rescue: " + b);
    expect(c).to.equal(Number(cur_bal));
    let r = Number(x) + Number(y);
    expect(Number(o_cur_bal).toFixed(4)).to.equal(r.toFixed(4));
    expect(Number(a)).to.equal(Number(0));
    expect(Number(b)).to.equal(Number(0));
    //
    //await TreasuryContract.HaltContribution();

    //let r = ethers.utils.formatEther(await owner.getBalance());
    //console.log(r);
    //expect(Number(r)).to.be.above(Number(800));
  });

  it("Should Manage to Rescue All Staked Funds (AVAX)", async function () {
    const avAVAX = new ethers.Contract(
      "0x6d80113e533a2C0fe82EaBD35f1875DcEA89Ea97",
      abi,
      owner
    );
    const WAVAX = new ethers.Contract(
      "0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7",
      abi,
      owner
    );

    let temporaryContract = TreasuryContract.connect(wallet1);
    await temporaryContract.ContributeAVAX({ value: FiftyAvax });

    let x = ethers.utils.formatEther(await TreasuryContract.GetColdAvax());
    //console.log("Cold AVAX Pre Rescue: " + x);
    await ethers.provider.send("evm_increaseTime", [SixMonths]);
    await ethers.provider.send("evm_mine");
    let y = ethers.utils.formatEther(
      await TreasuryContract.GetPendingYieldAVAX()
    );
    //console.log("Yield AVAX Pre Rescue: " + y);
    let pre_bal = ethers.utils.formatEther(
      await WAVAX.balanceOf(wallet1.address)
    ); // .getBalance());
    let o_pre_bal = ethers.utils.formatEther(
      await avAVAX.balanceOf(owner.address)
    );
    await TreasuryContract.RescueAvax();
    let c = Number(pre_bal) + Number(37.5); // 37.5 is 75% of FiftyAvax;
    let cur_bal = ethers.utils.formatEther(
      await WAVAX.balanceOf(wallet1.address)
    );
    let o_cur_bal = ethers.utils.formatEther(
      await avAVAX.balanceOf(owner.address)
    );
    //console.log("wallet1 pre balance - " + pre_bal);
    //console.log("wallet1 post balance prediction - " + c);
    //console.log("wallet1 current balance - " + Number(cur_bal));
    //console.log("owner pre avAvax balance - " + o_pre_bal);
    //console.log("owner post avAVAX balance - " + o_cur_bal);
    let a = ethers.utils.formatEther(await TreasuryContract.GetColdAvax());
    let b = ethers.utils.formatEther(await TreasuryContract.GetYieldAvax());
    //console.log("Cold AVAX Post Rescue: " + a);
    //console.log("Yield AVAX Post Rescue: " + b);
    expect(c).to.equal(Number(cur_bal));
    let r = Number(x) + Number(y);
    expect(Number(o_cur_bal).toFixed(4)).to.equal(r.toFixed(4));
    expect(Number(a)).to.equal(Number(0));
    expect(Number(b)).to.equal(Number(0));
    //
    //await TreasuryContract.HaltContribution();

    //let r = ethers.utils.formatEther(await owner.getBalance());
    //console.log(r);
    //expect(Number(r)).to.be.above(Number(800));
  });

  it("Should recieve 1 AVAX from Wallet 1 and Swept by Wallet 0 (AVAX)", async function () {
    await wallet1.sendTransaction({
      to: TreasuryContract.address,
      value: ethers.utils.parseEther("1.0"),
    });
    let a = ethers.utils.formatEther(await TreasuryContract.GetColdAvax());
    expect(Number(a)).to.equal(Number(0));
    await TreasuryContract.SweepAvax();
    let b = ethers.utils.formatEther(await TreasuryContract.GetColdAvax());
    expect(Number(b)).to.be.above(Number(1));
  });

  it("Should recieve 100 Dai from Wallet 1 and Swept by Wallet 0 (DAI)", async function () {
    const DAIe = new ethers.Contract(daiAddr, abi, wallet1);
    let tcOne = TreasuryContract.connect(wallet1);

    await DAIe.approve(TreasuryContract.address, MAXDai); // Should be MAX
    await tcOne.GiveMeDai({ value: ThousandAvax });

    let a = ethers.utils.formatEther(await TreasuryContract.GetColdDai());
    expect(Number(a)).to.equal(Number(0));

    await DAIe.transfer(TreasuryContract.address, HundreadDai);
    await TreasuryContract.SweepDai();

    let b = ethers.utils.formatEther(await TreasuryContract.GetColdDai());
    //let c = ethers.utils.formatEther(await TreasuryContract.GetTotalDaiContribution());
    //console.log(b); console.log(ethers.utils.formatEther(b));
    expect(Number(b)).to.equal(Number(100));
    //expect(Number(c)).to.equal(Number(100));
  });
});

describe("YIELDRISE Treasury Yielding Mechanics", function () {
  it("Should Give Wallet One 25% AVAX Reward & Wallet Three Contribution Percentage should equal 12.5% (DAI)", async function () {
    const DAIe = new ethers.Contract(daiAddr, abi, owner);
    const DAIe_One = new ethers.Contract(daiAddr, abi, wallet1);
    const DAIe_Two = new ethers.Contract(daiAddr, abi, wallet2);
    const DAIe_Three = new ethers.Contract(daiAddr, abi, wallet3);

    let tcOne = TreasuryContract.connect(wallet1);
    let tcTwo = TreasuryContract.connect(wallet2);
    let tcThree = TreasuryContract.connect(wallet3);

    await DAIe.approve(TreasuryContract.address, MAXDai); // Should be MAX
    await TreasuryContract.GiveMeDai({ value: ThousandAvax });
    await TreasuryContract.Contribute(TenThousandDai);

    await DAIe_One.approve(TreasuryContract.address, MAXDai); // Should be MAX
    await tcOne.GiveMeDai({ value: ThousandAvax });
    await tcOne.Contribute(FiveThousandDai);

    await DAIe_Two.approve(TreasuryContract.address, MAXDai); // Should be MAX
    await tcTwo.GiveMeDai({ value: ThousandAvax });
    await tcTwo.Contribute(TwoThoundsandFiveDai);

    await DAIe_Three.approve(TreasuryContract.address, MAXDai); // Should be MAX
    await tcThree.GiveMeDai({ value: ThousandAvax });
    await tcThree.Contribute(TwoThoundsandFiveDai);

    await ethers.provider.send("evm_increaseTime", [OneMonth]);
    await ethers.provider.send("evm_mine");
    console.log("    ! Attempting to Farm Yields");
    await TreasuryContract.FarmYields();
    //let result = await TreasuryContract.YieldBalances();
    let yDAI = ethers.utils.formatEther(await TreasuryContract.GetYieldDai());
    console.log("    ? DAI YIELDED: " + yDAI);
    //console.log("    ? CRV YIELDED: " + ethers.utils.formatEther(await TreasuryContract.yCRV()));
    let a = ethers.utils.formatEther(
      await TreasuryContract.GetContributerYield(wallet1.address)
    );
    let b = ethers.utils.formatUnits(
      await TreasuryContract.GetContributerPercentageByAddress(wallet3.address),
      2
    );
    let r = yDAI / 4; // 25%;
    //console.log(r); console.log(a); console.log(yAVAX);
    expect(Number(a).toFixed(5)).to.equal(Number(r).toFixed(5)); // Expect Wallet 1 yAVAX = 25%of(yAVAX);
    expect(Number(b)).to.equal(Number(12.5)); // Expect Wallet 3 c% = 12.5
  });

  it("Should Give Wallet One 25% AVAX Reward & Wallet Three Contribution Percentage should equal 12.5% (AVAX)", async function () {
    let tcOne = TreasuryContract.connect(wallet1);
    let tcTwo = TreasuryContract.connect(wallet2);
    let tcThree = TreasuryContract.connect(wallet3);
    await TreasuryContract.ContributeAVAX({ value: FiftyAvax });
    await tcOne.ContributeAVAX({ value: TwentyFiveAvax });
    await tcTwo.ContributeAVAX({ value: TwelveFiveAvax });
    await tcThree.ContributeAVAX({ value: TwelveFiveAvax });
    await ethers.provider.send("evm_increaseTime", [OneMonth]);
    await ethers.provider.send("evm_mine");
    console.log("    ! Attempting to Farm Yields");
    await TreasuryContract.FarmAVAXYields();
    //let result = await TreasuryContract.YieldBalances();
    let yAVAX = ethers.utils.formatEther(await TreasuryContract.GetYieldAvax());
    console.log("    ? WAVAX YIELDED: " + yAVAX);
    //console.log("    ? CRV YIELDED: " + ethers.utils.formatEther(await TreasuryContract.yCRV()));
    let a = ethers.utils.formatEther(
      await TreasuryContract.GetContributerAVAXYield(wallet1.address)
    );
    let b = ethers.utils.formatUnits(
      await TreasuryContract.GetContributerAVAXPercentageByAddress(
        wallet3.address
      ),
      2
    );
    let r = yAVAX / 4; // 25%;
    //console.log(r); console.log(a); console.log(yAVAX);
    expect(Number(a).toFixed(5)).to.equal(Number(r).toFixed(5)); // Expect Wallet 1 yAVAX = 25%of(yAVAX);
    expect(Number(b)).to.equal(Number(12.5)); // Expect Wallet 3 c% = 12.5
  });

  it("Should Farm Yields and Increase Wallet 0 Contribution Amount upon their second contribution (DAI)", async function () {
    let HundreadAvax = ethers.utils.parseEther("100");
    const DAIe = new ethers.Contract(daiAddr, abi, owner);
    await DAIe.approve(TreasuryContract.address, MAXDai); // Should be MAX
    await TreasuryContract.GiveMeDai({ value: HundreadAvax });
    let ThousandDai = ethers.utils.parseEther("1000");
    await TreasuryContract.Contribute(ThousandDai);

    let a = ethers.utils.formatEther(
      await TreasuryContract.GetContributionAmount(owner.address)
    ); // 1,000

    await ethers.provider.send("evm_increaseTime", [OneMonth]);
    await ethers.provider.send("evm_mine");

    //await TreasuryContract.GiveMeDai({ value: ThousandAvax });
    await TreasuryContract.Contribute(ThousandDai);

    let yDAI = ethers.utils.formatEther(await TreasuryContract.GetYieldDai()); // > 0
    let b = ethers.utils.formatEther(
      await TreasuryContract.GetContributionAmount(owner.address)
    ); // 2,000
    let c = Number(a) + Number(1000);
    let d = ethers.utils.formatEther(
      await TreasuryContract.GetContributerYield(owner.address)
    );
    //console.log(a); console.log(b); console.log(c);
    //console.log(yDAI);
    expect(Number(b)).to.equal(Number(c));
    expect(Number(d)).to.equal(Number(yDAI));
  });

  it("Should Farm Yields and Increase Wallet 0 Contribution Amount upon their second contribution (AVAX)", async function () {
    await TreasuryContract.ContributeAVAX({ value: FiftyAvax });
    let a = ethers.utils.formatEther(
      await TreasuryContract.GetContributionAVAXAmount(owner.address)
    ); // 50
    await ethers.provider.send("evm_increaseTime", [OneMonth]);
    await ethers.provider.send("evm_mine");
    await TreasuryContract.ContributeAVAX({ value: FiftyAvax });
    let yAVAX = ethers.utils.formatEther(await TreasuryContract.GetYieldAvax()); // > 0
    let b = ethers.utils.formatEther(
      await TreasuryContract.GetContributionAVAXAmount(owner.address)
    ); // 100
    let c = Number(a) + Number(50); // 75% unstaking
    let d = ethers.utils.formatEther(
      await TreasuryContract.GetContributerAVAXYield(owner.address)
    );
    //console.log(a); console.log(b); console.log(c);
    //console.log(yAVAX);
    expect(Number(b)).to.equal(Number(c));
    expect(Number(d)).to.equal(Number(yAVAX));
  });

  it("Should Give Wallet 1 Yield upon Yield claim (WAVAX)", async function () {
    const wAVAX = new ethers.Contract(wavaxAddr, abi, owner.provider);
    let a = ethers.utils.formatEther(await wAVAX.balanceOf(wallet5.address));
    expect(Number(a)).to.equal(Number(0));
    let tcOne = TreasuryContract.connect(wallet5);
    await tcOne.ContributeAVAX({ value: TwentyFiveAvax });
    await ethers.provider.send("evm_increaseTime", [OneMonth]);
    await ethers.provider.send("evm_mine");
    console.log("    ! Attempting to Farm AVAX Yields");
    await TreasuryContract.FarmAVAXYields();
    let x = ethers.utils.formatEther(
      await TreasuryContract.GetContributerAVAXYield(wallet5.address)
    );
    expect(Number(x)).to.be.above(Number(0));
    await tcOne.ClaimYieldAVAX();
    let y = ethers.utils.formatEther(await wAVAX.balanceOf(wallet5.address));
    expect(Number(y)).to.equal(Number(x));
  });

  it("Should Give Wallet 1 Yield upon Yield claim (DAI)", async function () {
    const DAIe = new ethers.Contract(daiAddr, abi, wallet5);
    await DAIe.approve(TreasuryContract.address, MAXDai); // Should be MAX
    let a = ethers.utils.formatEther(await DAIe.balanceOf(wallet5.address));
    expect(Number(a)).to.equal(Number(0));

    let tcOne = TreasuryContract.connect(wallet5);
    await tcOne.GiveMeDai({ value: ThousandAvax });
    await tcOne.Contribute(TenThousandDai);
    await ethers.provider.send("evm_increaseTime", [OneMonth]);
    await ethers.provider.send("evm_mine");
    console.log("    ! Attempting to Farm Yields");
    await TreasuryContract.FarmYields();
    let x = ethers.utils.formatEther(
      await TreasuryContract.GetContributerYield(wallet5.address)
    );
    expect(Number(x)).to.be.above(Number(0));
    //console.log(x);
    await tcOne.ClaimYield();
    let b = ethers.utils.formatEther(await DAIe.balanceOf(wallet5.address));
    //console.log(b);
    expect(Number(b)).to.be.above(Number(0.02));
    let c = ethers.utils.formatEther(
      await TreasuryContract.GetContributerYield(wallet5.address)
    );
    expect(Number(c)).to.equal(Number(0));
  });

  it("Should Fetch correct yield for Contributers (DAIe)", async function () {
    let tcOne = TreasuryContract.connect(wallet1);
    const DAIe = new ethers.Contract(daiAddr, abi, wallet1);
    await DAIe.approve(TreasuryContract.address, MAXDai); // Should be MAX

    let tcTwo = TreasuryContract.connect(wallet2);
    const DAIe_Two = new ethers.Contract(daiAddr, abi, wallet2);
    await DAIe_Two.approve(TreasuryContract.address, MAXDai); // Should be MAX

    let tcThree = TreasuryContract.connect(wallet3);
    const DAIe_Three = new ethers.Contract(daiAddr, abi, wallet3);
    await DAIe_Three.approve(TreasuryContract.address, MAXDai); // Should be MAX

    await tcOne.GiveMeDai({ value: ThousandAvax });
    await tcTwo.GiveMeDai({ value: ThousandAvax });
    await tcThree.GiveMeDai({ value: ThousandAvax });

    let FiveThousandDai = ethers.utils.parseEther("5000");
    await tcOne.Contribute(FiveThousandDai);
    await tcTwo.Contribute(TwoThoundsandFiveDai);
    let OneThousandTwoHundreadAndFiftyDai = ethers.utils.parseEther("1250");
    await tcThree.Contribute(OneThousandTwoHundreadAndFiftyDai);
    await ethers.provider.send("evm_increaseTime", [OneMonth]);
    await ethers.provider.send("evm_mine");
    console.log("    ! Attempting to Farm Yields");
    await TreasuryContract.FarmYields();
    //console.log(ethers.utils.formatEther(await TreasuryContract.GetContributerYield(wallet1.address)));
    let a = ethers.utils.formatEther(
      await TreasuryContract.GetContributerYield(wallet1.address)
    );
    let b = ethers.utils.formatEther(
      await TreasuryContract.GetContributerYield(wallet2.address)
    );
    let c = ethers.utils.formatEther(
      await TreasuryContract.GetContributerYield(wallet3.address)
    );
    //console.log(b);
    expect(Number(a)).to.be.above(Number(b));
    expect(Number(b)).to.be.above(Number(c));
  });

  it("Should Fetch correct yield for Contributers (AVAX)", async function () {
    let tcOne = TreasuryContract.connect(wallet1);
    let tcTwo = TreasuryContract.connect(wallet2);
    let tcThree = TreasuryContract.connect(wallet3);
    await tcOne.ContributeAVAX({ value: FiftyAvax });
    await tcTwo.ContributeAVAX({ value: TwentyFiveAvax });
    await tcThree.ContributeAVAX({ value: TwelveFiveAvax });
    await ethers.provider.send("evm_increaseTime", [OneMonth]);
    await ethers.provider.send("evm_mine");
    console.log("    ! Attempting to Farm Yields");
    await TreasuryContract.FarmAVAXYields();
    //console.log(ethers.utils.formatEther(await TreasuryContract.GetContributerYield(wallet1.address)));
    let a = ethers.utils.formatEther(
      await TreasuryContract.GetContributerAVAXYield(wallet1.address)
    );
    let b = ethers.utils.formatEther(
      await TreasuryContract.GetContributerAVAXYield(wallet2.address)
    );
    let c = ethers.utils.formatEther(
      await TreasuryContract.GetContributerAVAXYield(wallet3.address)
    );
    //console.log(b);
    expect(Number(a)).to.be.above(Number(b));
    expect(Number(b)).to.be.above(Number(c));
  });

  it("Should make Yield AVAX 0 when all contributers have yielded", async function () {
    let tcOne = TreasuryContract.connect(wallet1);
    let tcTwo = TreasuryContract.connect(wallet2);
    let tcThree = TreasuryContract.connect(wallet3);
    await tcOne.ContributeAVAX({ value: FiftyAvax });
    await tcTwo.ContributeAVAX({ value: TwentyFiveAvax });
    await tcThree.ContributeAVAX({ value: TwelveFiveAvax });
    await ethers.provider.send("evm_increaseTime", [OneMonth]);
    await ethers.provider.send("evm_mine");
    console.log("    ! Attempting to Farm Yields");
    await TreasuryContract.FarmAVAXYields();
    //console.log(ethers.utils.formatEther(await TreasuryContract.GetContributerYield(wallet1.address)));
    let a = ethers.utils.formatEther(await TreasuryContract.GetYieldAvax());
    expect(Number(a)).to.be.above(Number(0));
    //console.log(ethers.utils.formatEther(await TreasuryContract.yAVAX()));
    await tcOne.ClaimYieldAVAX();
    //console.log(ethers.utils.formatEther(await TreasuryContract.yAVAX()));
    await tcTwo.ClaimYieldAVAX();
    //console.log(ethers.utils.formatEther(await TreasuryContract.yAVAX()));
    await tcThree.ClaimYieldAVAX();
    //console.log(ethers.utils.formatEther(await TreasuryContract.yAVAX()));
    //console.log(b);
    let b = ethers.utils.formatEther(await TreasuryContract.GetYieldAvax());
    expect(Number(b).toFixed(4)).to.equal(Number(0).toFixed(4));
  });

  it("Should make Yield DAI 0 when all contributers have yielded", async function () {
    let tcOne = TreasuryContract.connect(wallet1);
    const DAIe = new ethers.Contract(daiAddr, abi, wallet1);
    await DAIe.approve(TreasuryContract.address, MAXDai); // Should be MAX

    let tcTwo = TreasuryContract.connect(wallet2);
    const DAIe_Two = new ethers.Contract(daiAddr, abi, wallet2);
    await DAIe_Two.approve(TreasuryContract.address, MAXDai); // Should be MAX

    let tcThree = TreasuryContract.connect(wallet3);
    const DAIe_Three = new ethers.Contract(daiAddr, abi, wallet3);
    await DAIe_Three.approve(TreasuryContract.address, MAXDai); // Should be MAX

    await tcOne.GiveMeDai({ value: ThousandAvax });
    await tcTwo.GiveMeDai({ value: ThousandAvax });
    await tcThree.GiveMeDai({ value: ThousandAvax });

    let FiveThousandDai = ethers.utils.parseEther("5000");
    let OneThousandTwoHundreadAndFiftyDai = ethers.utils.parseEther("1250");

    await tcOne.Contribute(FiveThousandDai); // 5000
    await tcTwo.Contribute(TwoThoundsandFiveDai); // 2500
    await tcThree.Contribute(OneThousandTwoHundreadAndFiftyDai); // 1250

    await ethers.provider.send("evm_increaseTime", [OneMonth]);
    await ethers.provider.send("evm_mine");
    console.log("    ! Attempting to Farm Yields");
    await TreasuryContract.FarmYields();
    //console.log(ethers.utils.formatEther(await TreasuryContract.GetContributerYield(wallet1.address)));
    let a = ethers.utils.formatEther(await TreasuryContract.GetYieldDai());
    expect(Number(a)).to.be.above(Number(0));
    //console.log(ethers.utils.formatEther(await TreasuryContract.GetYieldDai()));
    await tcOne.ClaimYield();
    //console.log(ethers.utils.formatEther(await TreasuryContract.GetYieldDai()));
    await tcTwo.ClaimYield();
    //console.log(ethers.utils.formatEther(await TreasuryContract.GetYieldDai()));
    await tcThree.ClaimYield();
    //console.log(ethers.utils.formatEther(await TreasuryContract.GetYieldDai()));
    //console.log(b);
    let b = ethers.utils.formatEther(await TreasuryContract.GetYieldDai());
    expect(Number(b).toFixed(2)).to.equal(Number(0).toFixed(2));
  });

  it("Should Show Correct Pending Yield (DAI)", async function () {
    let HundreadAvax = ethers.utils.parseEther("100");
    const DAIe = new ethers.Contract(daiAddr, abi, owner);
    await DAIe.approve(TreasuryContract.address, MAXDai); // Should be MAX
    await TreasuryContract.GiveMeDai({ value: HundreadAvax });
    await TreasuryContract.Contribute(FiveThousandDai);

    let a = ethers.utils.formatEther(
      await TreasuryContract.GetContributerYield(owner.address)
    );
    expect(Number(a)).to.equal(Number(0));

    await ethers.provider.send("evm_increaseTime", [OneMonth]);
    await ethers.provider.send("evm_mine");
    await TreasuryContract.FarmYields();
    let b = ethers.utils.formatEther(
      await TreasuryContract.GetContributerYield(owner.address)
    );
    expect(Number(b)).to.be.above(Number(a));

    await ethers.provider.send("evm_increaseTime", [OneMonth]);
    await ethers.provider.send("evm_mine");
    await TreasuryContract.FarmYields();
    let c = ethers.utils.formatEther(
      await TreasuryContract.GetContributerYield(owner.address)
    );
    expect(Number(c)).to.be.above(Number(b));

    await ethers.provider.send("evm_increaseTime", [OneMonth]);
    await ethers.provider.send("evm_mine");
    await TreasuryContract.FarmYields();
    let d = ethers.utils.formatEther(
      await TreasuryContract.GetContributerYield(owner.address)
    );
    expect(Number(d)).to.be.above(Number(c));
  });

  it("Should Show Correct Pending Yield (AVAX)", async function () {
    let HundreadAvax = ethers.utils.parseEther("100");
    await TreasuryContract.ContributeAVAX({ value: HundreadAvax });

    let a = ethers.utils.formatEther(
      await TreasuryContract.GetContributerAVAXYield(owner.address)
    );
    expect(Number(a)).to.equal(Number(0));

    await ethers.provider.send("evm_increaseTime", [OneMonth]);
    await ethers.provider.send("evm_mine");
    await TreasuryContract.FarmAVAXYields();
    let b = ethers.utils.formatEther(
      await TreasuryContract.GetContributerAVAXYield(owner.address)
    );
    expect(Number(b)).to.be.above(Number(a));

    await ethers.provider.send("evm_increaseTime", [OneMonth]);
    await ethers.provider.send("evm_mine");
    await TreasuryContract.FarmAVAXYields();
    let c = ethers.utils.formatEther(
      await TreasuryContract.GetContributerAVAXYield(owner.address)
    );
    expect(Number(c)).to.be.above(Number(b));

    await ethers.provider.send("evm_increaseTime", [OneMonth]);
    await ethers.provider.send("evm_mine");
    await TreasuryContract.FarmAVAXYields();
    let d = ethers.utils.formatEther(
      await TreasuryContract.GetContributerAVAXYield(owner.address)
    );
    expect(Number(d)).to.be.above(Number(c));
  });

  /*it("Should farm AAVE Rewards", async function () {
    await TreasuryContract.ContributeAVAX({ value: ThousandAvax });
    await ethers.provider.send("evm_increaseTime", [OneMonth]);
    await ethers.provider.send("evm_mine");
    console.log("    ! Attempting to Farm AAVE Rewards");
    await TreasuryContract.GetAAVERewards();
    let a = ethers.utils.formatEther(await TreasuryContract.GetYieldAvax());
    expect(Number(a)).to.be.above(Number(0));
  });*/

  // Full Test Workflow, staking, unstaking, restaking, 4 wallets AVAX AND DAI and rescue

  // main net testing / frontend dev
});

describe("YIELDRISE Treasury Miscellaneous Tests ", function () {
  it("Should Renounce Contract upon Renounce", async function () {
    await TreasuryContract.ContributeAVAX({ value: FiftyAvax });
    let b = ethers.utils.formatEther(await TreasuryContract.GetColdAvax());
    expect(Number(b)).to.be.above(Number(0));
    await TreasuryContract.RescueAvax();
    let a = ethers.utils.formatEther(await TreasuryContract.GetColdAvax());
    expect(Number(a)).to.equal(Number(0));
    await TreasuryContract.RenounceContract();
    await TreasuryContract.ContributeAVAX({ value: FiftyAvax });
    let c = await TreasuryContract.CheckContractRenounced();
    var Renounced = false;
    try {
      await TreasuryContract.RescueAvax();
    } catch (error) {
      Renounced = true;
    }
    expect(Renounced).to.equal(true);
    expect(c).to.equal(true);
  });

  it("Should Change Minimum Contribution Amount when needed (AVAX)", async function () {
    await TreasuryContract.ContributeAVAX({ value: FiftyAvax });
    let a = ethers.utils.formatEther(await TreasuryContract.GetColdAvax());
    expect(Number(a)).to.be.above(Number(0));

    let HundreadAvax = ethers.utils.parseEther("100");
    await TreasuryContract.MinimumAvaxContribution(HundreadAvax);
    var Updated = false;

    try {
      await TreasuryContract.ContributeAVAX({ value: FiftyAvax });
    } catch (error) {
      Updated = true;
    }

    expect(Updated).to.equal(true);

    await TreasuryContract.ContributeAVAX({ value: HundreadAvax });
    let b = ethers.utils.formatEther(
      await TreasuryContract.GetLifetimeContributionAVAXAmount(owner.address)
    );
    expect(Number(b)).to.equal(Number(150));
  });

  it("Should Change Minimum Contribution Amount when needed (DAI)", async function () {
    const DAIe = new ethers.Contract(daiAddr, abi, owner);
    await DAIe.approve(TreasuryContract.address, MAXDai); // Should be MAX
    let HundreadAvax = ethers.utils.parseEther("100");
    await TreasuryContract.GiveMeDai({ value: HundreadAvax });

    let FiftyDai = ethers.utils.parseEther("50");
    await TreasuryContract.Contribute(FiftyDai);
    let a = ethers.utils.formatEther(await TreasuryContract.GetColdDai());
    expect(Number(a)).to.be.above(Number(0));

    let HundreadDai = ethers.utils.parseEther("100");
    await TreasuryContract.MinimumDaiContribution(HundreadDai);
    var Updated = false;

    try {
      await TreasuryContract.Contribute(FiftyDai);
    } catch (error) {
      Updated = true;
    }

    expect(Updated).to.equal(true);

    await TreasuryContract.Contribute(HundreadDai);
    let b = ethers.utils.formatEther(
      await TreasuryContract.GetLifetimeContributionAmount(owner.address)
    );
    expect(Number(b)).to.equal(Number(150));
  });
});

describe("YIELDRISE Production Simulator ", function () {
  it("Should Correctly Simulate a Production Enviroment. (DAI AND AVAX)", async function () {
    console.log("    # Generating Wallets");
    const DAIe = new ethers.Contract(daiAddr, abi, wallet1);
    const DAIe_Two = new ethers.Contract(daiAddr, abi, wallet2);
    const DAIe_Four = new ethers.Contract(daiAddr, abi, wallet4);

    const wAVAX = new ethers.Contract(wavaxAddr, abi, wallet2);

    let tcOne = TreasuryContract.connect(wallet1); // dai user
    let tcTwo = TreasuryContract.connect(wallet2); // dai user
    let tcThree = TreasuryContract.connect(wallet3); // avax user
    let tcFour = TreasuryContract.connect(wallet4); // avax user

    await DAIe.approve(TreasuryContract.address, MAXDai); // Should be MAX
    await tcOne.GiveMeDai({ value: ThousandAvax });

    await DAIe_Two.approve(TreasuryContract.address, MAXDai); // Should be MAX
    await tcTwo.GiveMeDai({ value: ThousandAvax });

    await DAIe_Four.approve(TreasuryContract.address, MAXDai); // Should be MAX
    await tcFour.GiveMeDai({ value: ThousandAvax });

    // Wallet Three Contributes 25 AVAX
    console.log("    ! w3 Contributing 25 AVAX");
    await tcThree.ContributeAVAX({ value: TwentyFiveAvax });
    //console.log(ethers.utils.formatEther(await TreasuryContract.GetContributionAVAXAmount(wallet3.address)));

    // Wallet One Contributes 1500 DAI
    console.log("    ! w1 Contributing 1500 DAI");
    let OneThousandFiveHundreadDai = ethers.utils.parseEther("1500");
    await tcOne.Contribute(OneThousandFiveHundreadDai);

    let a =
      (await TreasuryContract.GetContributerAVAXPercentageByAddress(
        wallet3.address
      )) / 100; // For Basis Points
    expect(Number(a)).to.equal(Number(100));
    let b =
      (await TreasuryContract.GetContributerPercentageByAddress(
        wallet1.address
      )) / 100; // For Basis Points
    expect(Number(b)).to.equal(Number(100));
    let c = ethers.utils.formatEther(await TreasuryContract.GetColdAvax());
    expect(Number(c)).to.equal(Number(6.25));
    let d = ethers.utils.formatEther(await TreasuryContract.GetColdDai());
    expect(Number(d)).to.equal(Number(375));

    console.log("    ! Waiting 1 Month and Farming Yields");
    await ethers.provider.send("evm_increaseTime", [OneMonth]);
    await ethers.provider.send("evm_mine");
    let e = ethers.utils.formatEther(await TreasuryContract.GetYieldAvax());
    let f = ethers.utils.formatEther(await TreasuryContract.GetYieldDai());
    expect(Number(e)).to.equal(Number(0));
    expect(Number(f)).to.equal(Number(0));
    await TreasuryContract.FarmAVAXYields();
    await TreasuryContract.FarmYields();
    let e_2 = ethers.utils.formatEther(await TreasuryContract.GetYieldAvax());
    let f_2 = ethers.utils.formatEther(await TreasuryContract.GetYieldDai());
    console.log("    ? " + e_2 + " AVAX Yielded");
    console.log("    ? " + f_2 + " DAI Yielded");
    expect(Number(e_2)).to.be.above(Number(0));
    expect(Number(f_2)).to.be.above(Number(0));

    // WALLET ONE CLAIMS YIELDS AND PULLS OUT
    let g = ethers.utils.formatEther(await TreasuryContract.GetHotDai());
    expect(Number(g)).to.equal(Number(1125));
    //console.log(ethers.utils.formatEther(await TreasuryContract.GetContributerYield(wallet1.address)))
    let g_2 = ethers.utils.formatEther(await DAIe.balanceOf(wallet1.address));
    await tcOne.ClaimYield();
    let g_3 = ethers.utils.formatEther(await DAIe.balanceOf(wallet1.address));
    let g_4 = Number(g_2) + Number(f_2);
    expect(Number(g_3).toFixed(3)).to.equal(g_4.toFixed(3));
    await tcOne.HaltContribution();
    let g_5 = ethers.utils.formatEther(await DAIe.balanceOf(wallet1.address));
    expect(Number(g_5).toFixed(5)).to.equal((g_4 + Number(g)).toFixed(5));
    let g_6 = ethers.utils.formatEther(await TreasuryContract.GetHotDai());
    expect(Number(g_6)).to.equal(Number(0));
    console.log("    ? w1 halted contribution successfully");

    // wallet two and four stake avax and dai
    console.log("    # w2 and w4 Contributing 1500 DAI and 25 AVAX Each");
    await tcTwo.Contribute(OneThousandFiveHundreadDai);
    await tcFour.Contribute(OneThousandFiveHundreadDai);
    await tcTwo.ContributeAVAX({ value: TwentyFiveAvax });
    await tcFour.ContributeAVAX({ value: TwentyFiveAvax });
    console.log(
      "    ? HOT Avax is now at " +
        ethers.utils.formatEther(await TreasuryContract.GetHotAvax())
    );
    console.log(
      "    ? HOT Dai is now at " +
        ethers.utils.formatEther(await TreasuryContract.GetHotDai())
    );
    // Check for 33% AVAX Yields
    let h = ethers.utils.formatEther(
      await TreasuryContract.GetContributerAVAXYield(wallet3.address)
    );
    console.log("    ! Waiting 6 Months and Farming Yields");
    await ethers.provider.send("evm_increaseTime", [SixMonths]);
    await TreasuryContract.FarmAVAXYields();
    await TreasuryContract.FarmYields();
    let i = ethers.utils.formatEther(await TreasuryContract.GetYieldAvax());
    let i_1 = ethers.utils.formatEther(
      await TreasuryContract.GetContributerAVAXYield(wallet2.address)
    );
    let i_2 = ethers.utils.formatEther(
      await TreasuryContract.GetContributerAVAXYield(wallet3.address)
    );
    let i_3 = ethers.utils.formatEther(
      await TreasuryContract.GetContributerAVAXYield(wallet4.address)
    );
    expect(Number(i_3).toFixed(5)).to.equal(Number(i_1).toFixed(5));
    let r = Number(i_2) - Number(h);
    expect(r.toFixed(5)).to.equal(Number(i_1).toFixed(5));
    // Check for 50/50 yields
    let i_4 = ethers.utils.formatEther(
      await TreasuryContract.GetContributerYield(wallet2.address)
    );
    let i_5 = ethers.utils.formatEther(
      await TreasuryContract.GetContributerYield(wallet4.address)
    );
    expect(Number(i_4).toFixed(4)).to.equal(Number(i_5).toFixed(4));
    console.log("    ? w1 Recontributes 500 DAI");

    // Wallet One comes back for more yields
    let j = ethers.utils.formatEther(
      await TreasuryContract.GetContributerYield(wallet1.address)
    );
    expect(Number(j)).to.equal(Number(0));
    let FiveHundreadDai = ethers.utils.parseEther("500");
    await tcOne.Contribute(FiveHundreadDai);

    console.log("    ? w2 halts AVAX Contribution");
    // Wallet two puls out avax only
    let j_1 = ethers.utils.formatEther(await wAVAX.balanceOf(wallet2.address));
    let j_2 =
      Number(j_1) +
      Number(
        ethers.utils.formatEther(
          await TreasuryContract.GetContributerUnstakeableAVAXAmount(
            wallet2.address
          )
        )
      );
    await tcTwo.HaltContributionAvax();
    let j_3 = ethers.utils.formatEther(await wAVAX.balanceOf(wallet2.address));
    expect(Number(j_3).toFixed(5)).to.equal(Number(j_2).toFixed(5));

    // Check w1 yield after 1 month > 0
    console.log("    ! Waiting 1 Month and Farming Yields");
    await ethers.provider.send("evm_increaseTime", [OneMonth]);
    await TreasuryContract.FarmAVAXYields();
    await TreasuryContract.FarmYields();
    let k = ethers.utils.formatEther(
      await TreasuryContract.GetContributerYield(wallet1.address)
    );
    expect(Number(k)).to.be.above(Number(0));
  });

  // EXPORT FUNCTIONS
});
