"use client";

  import  {FC, useEffect, useState } from "react";
  import { Box, Title, Card, Button, Group, Divider, Switch, Text,  } from "@mantine/core";
  import {  getContract, defineChain, ADDRESS_ZERO, prepareContractCall, NATIVE_TOKEN_ADDRESS } from "thirdweb";
  import {  allowance } from "thirdweb/extensions/erc20";
  import SwapInput from "./tokenSeleterBasic";
  import {  TransactionButton, useActiveAccount, useReadContract, useSendAndConfirmTransaction } from "thirdweb/react";
  import { getAmountsIn, getAmountsOut } from "./functions";
  import { client } from "@/app/constants";
  import styles from "./Home.module.css";


  type TupleType = readonly (readonly [string, string, boolean, string])[];


  type Token = {
    name: string;
    symbol: string;
    contractAddress: string;
    image: string;
    price?: string;
    value?: string;
    balance?: string; 
    coinCecko?: string;
    hasTax?: boolean;
    decimals: number;
  };
interface WalletDetailsModalProps {
  chainId: number;
  feeReciever: string;
  tokens: Token[];
  WETH9: string;
  routerPlasma: string; 
}

export const SwapInterface: FC<WalletDetailsModalProps> = ({
  chainId,
  tokens,
  WETH9,
  routerPlasma,
  feeReciever,

}) => {
  const account = useActiveAccount();
  const { mutateAsync: mutateTransaction } = useSendAndConfirmTransaction();

  const [currentFrom, setCurrentFrom] = useState<string>("native");
  const [isApproving, setIsApproving] = useState(false);

  const NETWORK = defineChain(chainId);
  const [tokenA, setTokenA] = useState<Token>(tokens[0]);
  const [tokenB, setTokenB] = useState<Token>(tokens[1]);
  const [amountOut, setAmountOut] = useState<string>("");
  const [amountOutBigInt, setAmountOutBigInt] = useState(0n);
  const [amountIn, setAmountIn] = useState("");
  const [amountInBigInt, setAmountInBigint] = useState(0n);
  const [router, setRouter] = useState<string>("");
  const [factory, setFactoryAddress] = useState<string>("");
  const [fee, setFee] = useState<number>(0);
  const [bestRoute, setRoute] = useState<any>();
  const [dexStep, setDexStep] = useState<string>("");
  const [buyingStep, setBuyingStep] = useState<string>("confirm");
  const [tokenSelecter, setTokenSelecter] = useState(false);
  const [selectToken, setSelectToken] = useState<"native" | "token" >("native");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isFast, setIsFast] = useState(false);
  const [WETH, setWETH] = useState<Token>();
  const [feeAmount, setFeeAmount] = useState<bigint>(0n);

  // Define base and fast gas prices
  const BASE_GAS_PRICE = BigInt(1000000000000);  // 1 Qev
  const FAST_GAS_PRICE = BigInt(1800000000000);  // 1.2 Qev
  
  const gasPrice = isFast ? FAST_GAS_PRICE : BASE_GAS_PRICE;

  const feePath = {
    feeRecipient: "0x515D1BcEf9536075CC6ECe0ff21eCCa044Db9446", 
    tokenIn: WETH9, 
    amountIn: 0n, 
    nativeIn: 0n,
  };

  const handleDropdownOpen = (type: "native" | "token") => {
    setTokenSelecter(true); // ✅ Open dropdown
    setSelectToken(type);   // ✅ Set type
  };


  const handleAmountInChange = (value: string) => {
    setAmountIn(value);
    setCurrentFrom("A"); // Mark input A as active
  };

  const handleAmountOutChange = (value: string) => {
    setAmountOut(value);
    setCurrentFrom("B"); // Mark input B as active
  };

  const handleSelectToken = (token: Token, type: "native" | "token") => {
    type === "native" ? setTokenA(token) : setTokenB(token);
    setTokenSelecter(false);
  };
  

  const { data: ERC20Approval } = useReadContract(allowance, {
    contract: getContract({client, chain:NETWORK, address: tokenA?.contractAddress || ADDRESS_ZERO}),
    owner: account?.address || ADDRESS_ZERO,
    spender: routerPlasma,
  });

  useEffect(() => {
    if (ERC20Approval && account && amountIn && tokenA) {
      const parsedAmountIn = BigInt(
        Math.round(Number(amountIn) * 10 ** tokenA?.decimals)
      );
  
      const isApproved = BigInt(ERC20Approval) >= parsedAmountIn;
  
      if (isApproved) {
        setBuyingStep("confirm");
      }
    }
  }, [ERC20Approval, account, amountIn, tokenA]); 

  const handleSetApproval2 = async (tokenAddress: string) => {
    const tokenContract = getContract({
      address: tokenAddress,
      client,
      chain: NETWORK,
    });
  
    setIsApproving(true);
    setMessage("⏳ Approving token...");
  
    try {
      const tx = await prepareContractCall({
        contract: tokenContract,
        method:
        "function approve(address spender, uint256 value) returns (bool)",
        params: [routerPlasma, 115792089237316195423570985008687907853269984665640564039457584007913129639935n],
        gas: 500000n,
        gasPrice: 1000000000000n,
        maxFeePerGas: 1000000000000n,
        maxPriorityFeePerGas: 1000000000000n,   
        });
  
      setMessage("📤 Approval transaction sent. Waiting for confirmation...");
  
      await mutateTransaction(tx);
  
      setMessage(
        `✅ Approval successful! 🎉 <br /> `
        
      );
  
      setBuyingStep("confirm");
    } catch (err) {
      console.error("❌ Error during approval:", err);
      setMessage("❌ Approval failed. Please try again.");
    } finally {
      setIsApproving(false);
    }
  };
  

  
  useEffect(() => {
    if (
      tokenA?.contractAddress === WETH9 &&
      tokenB?.contractAddress.toLowerCase() === NATIVE_TOKEN_ADDRESS.toLowerCase()
    ) {
      setBuyingStep("approval");
    } else if (
      tokenA?.contractAddress.toLowerCase() === NATIVE_TOKEN_ADDRESS.toLowerCase()           ) {
      setBuyingStep("confirm");
    } else {
      setBuyingStep("approval");
    }
  }, [tokenA, tokenB,WETH9])


  const fetchFeeAmount = async () => {
    if (tokenA && WETH) {

      try {
        const Amounts = await getAmountsOut(
          tokenA,
          WETH,
           4689,
          Math.round(Number(amountIn)* 0.01)
        );

        console.log("📦 getAmountsOut response:", Amounts);

        if (!Amounts) {
          console.warn("⚠️ No amount received from getAmountsOut");
          return;
        }

        const formattedAmountOut = (Number(Amounts.bestAmountOut) / 10 ** tokenB.decimals).toFixed(4);
        console.log("🔹 Formatted Amount Out:", formattedAmountOut);
        const bestAmount = (Amounts?.bestAmountOut || 1n * BigInt(99)) / BigInt(100)

        setFeeAmount(bestAmount);
       

      } catch (error) {
        console.error("❌ Error fetching amounts out:", error);
      }
    } else {
      console.warn("⚠️ fetchAmountsOut skipped: tokenA or tokenB is missing");
    }
  };
  

  useEffect(() => {
    console.log("🔄 useEffect triggered (amountIn update)");
  
    const fetchAmountsOut = async () => {
      if (currentFrom === "A" &&tokenA && tokenB) {
        console.log("⚡ Calling getAmountsOut with:", { tokenA, tokenB, chainId, amountIn });
  
        try {
          const Amounts = await getAmountsOut(
            tokenA,
            tokenB,
             4689,
            Math.round(Number(amountIn))
          );
  
          console.log("📦 getAmountsOut response:", Amounts);
  
          if (!Amounts) {
            console.warn("⚠️ No amount received from getAmountsOut");
            return;
          }
  
          const formattedAmountOut = (Number(Amounts.bestAmountOut) / 10 ** tokenB.decimals).toFixed(4);
          console.log("🔹 Formatted Amount Out:", formattedAmountOut);
          const bestAmount = (Amounts?.bestAmountOut || 1n * BigInt(99)) / BigInt(100)

          setAmountOut(formattedAmountOut);
          setAmountOutBigInt(bestAmount);
          setRouter(Amounts.routerAddress);
          setFee(Amounts.fee);
          setRoute(Amounts.route);
          setDexStep(Amounts.bestDex);
          setFactoryAddress(Amounts.factory);
  
        } catch (error) {
          console.error("❌ Error fetching amounts out:", error);
        }
      } else {
        console.warn("⚠️ fetchAmountsOut skipped: tokenA or tokenB is missing");
      }
    };
  
    fetchAmountsOut();
  }, [amountIn, tokenA, tokenB, chainId, currentFrom]);
  
  
  useEffect(() => {
    console.log("🔄 useEffect triggered (amountOut update)");
    console.log("✅ Dependencies:", { amountOut, currentFrom, tokenA, tokenB, chainId });
  
    const fetchAmountsIn = async () => {
      if (currentFrom === "B" && tokenA && tokenB) {
        console.log("⚡ Calling getAmountsIn with:", { tokenA, tokenB, chainId, amountOut });
  
        try {
          const Amounts = await getAmountsIn(
            tokenA,
            tokenB,
            chainId || 4689,
            Math.round(Number(amountOut))
          );
  
          console.log("📦 getAmountsIn response:", Amounts);
  
          if (!Amounts) {
            console.warn("⚠️ No amount received from getAmountsIn");
            return;
          }
  
          const formattedAmountOut = (
            (Number(Amounts.bestAmountOut) * 1.02) / // Increase by 1%
            10 ** (tokenA?.decimals || 18) // Default to 18 if decimals is undefined
          ).toFixed(6);
  
          console.log("🔹 Formatted Amount Out:", formattedAmountOut);
          const amountIn = (Amounts?.bestAmountOut || 1n * BigInt(101)) / BigInt(100)

          setAmountIn(formattedAmountOut);
          setAmountInBigint(amountIn);
          setRouter(Amounts.routerAddress);
          setFactoryAddress(Amounts.factory)
          setFee(Amounts.fee);
          setRoute(Amounts.route);
          setDexStep(Amounts.bestDex);
  
        } catch (error) {
          console.error("❌ Error fetching amounts out:", error);
        }
      } else {
        console.warn("⚠️ fetchAmountsOut skipped: Either currentFrom is not 'B' or tokenA/tokenB is missing");
      }
    };
  
    fetchAmountsIn();
  }, [amountOut, currentFrom, tokenA, tokenB, chainId]);

  const filteredTokens = tokens.filter(
    (token) =>
      token.name.toLowerCase().includes(search.toLowerCase()) ||
      token.symbol.toLowerCase().includes(search.toLowerCase()) ||
      token.contractAddress.toLowerCase().includes(search.toLowerCase())
  );

  const truncate = (value: string) => {
    if (!value) return "";
    return value.length > 5 ? value.slice(0, 5) : value;
  };
    
  return (
      <div style={{ paddingBottom: "70px"
      }}>
        <Box
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Card
            shadow="xl"
            radius="xl"
            style={{
              width: "98%",
              backgroundColor: "rgba(255, 255, 255, 0.05)",
              color: "white",
              borderRadius: "16px",
            }}
          >
            {/* Title */}
            <Title  order={2} mb="lg" style={{align:"center"}}>
              Swap Tokens
            </Title>
    
            {/* Token Selector */}
            {tokenSelecter && (
              <Box
                style={{
                  border: "2px solid #61dafb",
                  borderRadius: "12px",
                  backgroundColor: "rgba(255, 255, 255, 0.05)",
                  width: "98%",
                  height: "60vh",
                  overflowY: "auto",
                }}
              >
                {/* Search Input */}
                <input
                  type="text"
                  placeholder="Search token..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className={styles.searchInput}
                  style={{
                    width: "100%",
                    padding: "0.5rem",
                    borderRadius: "8px",
                    border: "1px solid #61dafb",
                    backgroundColor: "rgba(255, 255, 255, 0.1)",
                    color: "white",
                    fontSize: "1rem",
                    marginBottom: "0.5rem",
                  }}
                />
    
                {/* Token List */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.5rem",
                  }}
                >
                  {filteredTokens.length > 0 ? (
                    filteredTokens.map((token) => (
                      <div
                        key={token.contractAddress}
                        onClick={() => handleSelectToken(token, selectToken)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "0.75rem",
                          borderRadius: "8px",
                          cursor: "pointer",
                          transition: "background-color 0.2s",
                          border: "1px solid #61dafb",
                          backgroundColor: "rgba(255, 255, 255, 0.05)",
                        }}
                      >
                        <img
                          src={token.image}
                          alt={token.symbol}
                          style={{ width: "30px", height: "30px", borderRadius: "50%" }}
                        />
                        <div>
                          <p style={{ fontSize: "1rem", fontWeight: 500 }}>{token.name}</p>
                          <p style={{ fontSize: "0.85rem", color: "gray" }}>{token.symbol}</p>
                        </div>
                        <span style={{ fontSize: "0.9rem", fontWeight: 500 }}>
                          {truncate(token.balance || "0")}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p style={{ textAlign: "center", color: "gray" }}>No tokens found.</p>
                  )}
                </div>
              </Box>
            )}
    
            {/* Swap Inputs */}
            {!tokenSelecter && (
              <Box style={{ width: "98%" }}>
                <Group justify="center" style={{ width: "98%" }}>
                  {/* Input for Token A */}
                  {tokens && (
                    <SwapInput
                      type="native"
                      max={tokenA?.balance || "0"}
                      value={amountIn}
                      setValue={handleAmountInChange}
                      tokenList={tokens}
                      setDropdownOpen={handleDropdownOpen}
                      onSelectToken={(token) => handleSelectToken(token, "native")}
                      selectedToken={tokenA}
                    />
                  )}
    
           
                  
    
                  {/* Input for Token B */}
                  {tokens && (
                    <SwapInput
                      type="token"
                      max={tokenB?.balance || "0"}
                      value={amountOut}
                      setValue={handleAmountOutChange}
                      tokenList={tokens}
                      setDropdownOpen={handleDropdownOpen}
                      onSelectToken={(token) => handleSelectToken(token, "token")}
                      selectedToken={tokenB}
                    />
                  )}
                </Group>
    
                {/* Swap Message */}
                {message && (
                  <div
                    style={{
                      marginTop: "10px",
                      padding: "8px",
                      background: "#222",
                      color: "#fff",
                      borderRadius: "5px",
                      textAlign: "center",
                    }}
                    dangerouslySetInnerHTML={{ __html: message }}
                  />
                )}
    
                {/* Approve Button */}
                {buyingStep === "approval" && tokenA?.contractAddress !== "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee" && (
                  <Button
                    fullWidth
                    onClick={() => handleSetApproval2(tokenA.contractAddress)}
                    disabled={isApproving}
                    loading={isApproving}
                    style={{
                      marginTop: "1rem",
                      backgroundColor: "#61dafb",
                      color: "black",
                    }}
                  >
                    Approve Tokens
                  </Button>
                )}

                 {buyingStep === "confirm" && currentFrom === "A" && tokenA && tokenB && (
                      <div>
                        {dexStep === "WrappedContract" && tokenA.contractAddress.toLowerCase() === WETH9.toLowerCase() ? (
                          <TransactionButton
                          transaction={async () => {
                            setLoading(true);
                            setMessage("⏳ Preparing swap transaction...");                      
                            return prepareContractCall({
                              contract: getContract({ client: client,chain:defineChain(chainId), address:WETH9}),
                              method: "function withdraw(uint256 wed) payable",
                              params: [BigInt(Number(amountIn) * 10 ** 18)],
                              gas:500000n,
                              gasPrice: gasPrice,
                            })
                            setMessage("📤 Transaction sent. Waiting for confirmation...");
                
                          }}
                          disabled={loading} // ✅ Disable while processing
                
                          onTransactionSent={() => {
                            setMessage("📤 Swap transaction sent. Waiting for confirmation...");
                          }}
                          onError={(error) => {
                            setLoading(false);
                            setMessage("❌ Swap failed. Please try again.");
                            console.error("Transaction error:", error);
                          }}
                          onTransactionConfirmed={(txResult) => {
                            setLoading(false);
                            setMessage(
                              `✅ Swap Successful! 🎉 <br />
                              <a href="https://www.ioPlasmaVerse.com/transactionHash/${chainId}/${txResult.transactionHash}" 
                                 target="_blank" 
                                 style="color: #61dafb; text-decoration: underline;">
                              View Transaction</a>`
                            );
                          }}
                          
                        >
                        {loading ? "Swapping..." :  `Swap to ${tokenB?.name}`}
                    
                        </TransactionButton>
                        ) : tokenB.contractAddress.toLowerCase() === WETH9.toLowerCase() && dexStep === "WrappedContract" ? (
                          <TransactionButton  
                          transaction={async () => {
                            setLoading(true);
                            setMessage("⏳ Preparing swap transaction..."); 
                            return prepareContractCall({
                              contract: getContract({ client: client,chain:defineChain(chainId), address:WETH9}),
                              method: "function deposit() payable",
                              value: BigInt(Number(amountIn) * 10 ** 18),
                              gas:500000n,
                              gasPrice: gasPrice,
                            })                     
                            setMessage("📤 Transaction sent. Waiting for confirmation...");
                
                          }}
                          disabled={loading} // ✅ Disable while processing
                
                          onTransactionSent={() => {
                            setMessage("📤 Swap transaction sent. Waiting for confirmation...");
                          }}
                          onError={(error) => {
                            setLoading(false);
                            setMessage("❌ Swap failed. Please try again.");
                            console.error("Transaction error:", error);
                          }}
                          onTransactionConfirmed={(txResult) => {
                            setLoading(false);
                            setMessage(
                              `✅ Swap Successful! 🎉 <br />
                              <a href="https://www.ioPlasmaVerse.com/transactionHash/${chainId}/${txResult.transactionHash}" 
                                 target="_blank" 
                                 style="color: #61dafb; text-decoration: underline;">
                              View Transaction</a>`
                            );
                          }}
                          
                        >
                        {loading ? "Swapping..." :  `Swap to ${tokenB?.name}`}
                    
                        </TransactionButton>
                        
                        ) : dexStep === "Uniswapv2" ? (
                          <TransactionButton
                          transaction={async () => {
                            setLoading(true);
                            setMessage("⏳ Preparing swap transaction...");
                            
                            const parsedAmountIn = BigInt(
                              Math.round(Number(amountIn) * 10 ** tokenA?.decimals)
                            );  
                            
                            const minutes = 5; // Set deadline duration (5 minutes)
                            const deadline = Math.floor(Date.now() / 1000) + minutes * 60;                            
                                           const swapToNative = tokenB.contractAddress == NATIVE_TOKEN_ADDRESS ? true: false;
                                            console.log("fee",fee)
                                            const nativeAmount = tokenA.contractAddress == NATIVE_TOKEN_ADDRESS ? parsedAmountIn: 0n;
                                            const nativeIn = nativeAmount + feePath.nativeIn;
                                            
                                            const path =  
                                            {
                                             path: bestRoute, 
                                             SwapToNative: swapToNative,
                                             factory: factory
                   
                                           };
                                            
                                                  
                                          return  prepareContractCall({
                              contract: getContract({client,
                                chain: NETWORK,
                                address: routerPlasma}),
                              method: 
                              "function swapExactTokensForTokens(uint256 amountIn, uint256 amountOutMin, (address[] path, bool SwapToNative, address factory) path, (address feeRecipient, address tokenIn, uint256 amountIn, uint256 nativeIn) feeParams, address to, uint256 deadline) payable returns (uint256 amountOut)",
                
                              params: [parsedAmountIn,amountOutBigInt,path, feePath, account?.address || "",BigInt(deadline)],
                              value: nativeIn,
                              gas: 1000000n,
                              gasPrice: gasPrice,
                          type: "eip1559",
                          maxFeePerGas: gasPrice,
                          maxPriorityFeePerGas: gasPrice,
                
                            });
                            setMessage("📤 Transaction sent. Waiting for confirmation...");
                
                          }}
                          disabled={loading} // ✅ Disable while processing
                
                          onTransactionSent={() => {
                            setMessage("📤 Swap transaction sent. Waiting for confirmation...");
                          }}
                          onError={(error) => {
                            setLoading(false);
                            setMessage("❌ Swap failed. Please try again.");
                            console.error("Transaction error:", error);
                          }}
                          onTransactionConfirmed={(txResult) => {
                            setLoading(false);
                            setMessage(
                              `✅ Swap Successful! 🎉 <br />
                              <a href="https://www.ioPlasmaVerse.com/transactionHash/${chainId}/${txResult.transactionHash}" 
                                 target="_blank" 
                                 style="color: #61dafb; text-decoration: underline;">
                              View Transaction</a>`
                            );
                          }}
                          
                        >
                        {loading ? "Swapping..." :  `Swap to ${tokenB?.name}`}
                    
                        </TransactionButton>
                        ) : dexStep === "UniswapV3Multi" ? (
                          <TransactionButton
                          transaction={async () => {
                            setLoading(true);
                            setMessage("⏳ Preparing swap transaction...");
                            
                            const parsedAmountIn = BigInt(
                              Math.round(Number(amountIn) * 10 ** tokenA?.decimals)
                            );  
                    
                           
                            const tokenIn = tokenA.contractAddress == NATIVE_TOKEN_ADDRESS ? WETH9: tokenA.contractAddress;
                                           const tokenOut = tokenB.contractAddress == NATIVE_TOKEN_ADDRESS ? WETH9: tokenB.contractAddress;
                                           const swapToNative = tokenB.contractAddress == NATIVE_TOKEN_ADDRESS ? true: false;
                                            console.log("fee",fee)
                                            const nativeAmount = tokenA.contractAddress == NATIVE_TOKEN_ADDRESS ? parsedAmountIn: 0n;
                                            const nativeIn = nativeAmount + feePath.nativeIn;
                                            const params = {
                                              path: bestRoute, // Example tokenIn address
                                              recipient: account?.address || "",
                                              amountIn: parsedAmountIn,
                                              amountOutMinimum: 0n,
                                              tokenIn: tokenIn,
                                              tokenOut: tokenOut,
                                              swapToNative: swapToNative
                                            };
                                           
                                          
                            return           prepareContractCall({
                                              contract: getContract({client,
                                                chain: NETWORK,
                                                address: routerPlasma,}),
                                              method: 
                                              "function exactInput((bytes path, address recipient, uint256 amountIn, uint256 amountOutMinimum, address tokenIn, address tokenOut, bool swapToNative) params, (address feeRecipient, address tokenIn, uint256 amountIn, uint256 nativeIn) feeParams, address router, bool swapRouterV2) payable returns (uint256 amount)",
                                              params: [params, feePath, router, true],
                                              value: nativeIn,
                                              gas: 1000000n,
                                              gasPrice: gasPrice,
                                              type: "eip1559",
                                              maxFeePerGas: gasPrice,
                                              maxPriorityFeePerGas: gasPrice,    
                                                });
                                                setMessage("📤 Transaction sent. Waiting for confirmation...");
                
                          }}
                          disabled={loading} // ✅ Disable while processing
                
                          onTransactionSent={() => {
                            setMessage("📤 Swap transaction sent. Waiting for confirmation...");
                          }}
                          onError={(error) => {
                            setLoading(false);
                            setMessage("❌ Swap failed. Please try again.");
                            console.error("Transaction error:", error);
                          }}
                          onTransactionConfirmed={(txResult) => {
                            setLoading(false);
                            setMessage(
                              `✅ Swap Successful! 🎉 <br />
                              <a href="https://www.ioPlasmaVerse.com/transactionHash/${chainId}/${txResult.transactionHash}" 
                                 target="_blank" 
                                 style="color: #61dafb; text-decoration: underline;">
                              View Transaction</a>`
                            );
                          }}
                        >
                        {loading ? "Swapping..." :  `Swap to ${tokenB?.name}`}
                    
                        </TransactionButton>
                        ) : dexStep === "UniswapV3Single" ? (
                          <TransactionButton
                          transaction={async () => {
                            setLoading(true);
                            setMessage("⏳ Preparing swap transaction...");
                            
                            const parsedAmountIn = BigInt(
                              Math.round(Number(amountIn) * 10 ** tokenA?.decimals)
                            );  
                    
                           
                            const tokenIn = tokenA.contractAddress == NATIVE_TOKEN_ADDRESS ? WETH9: tokenA.contractAddress;
                                           const tokenOut = tokenB.contractAddress == NATIVE_TOKEN_ADDRESS ? WETH9: tokenB.contractAddress;
                                           const swapToNative = tokenB.contractAddress == NATIVE_TOKEN_ADDRESS ? true: false;
                                           const nativeAmount = tokenA.contractAddress == NATIVE_TOKEN_ADDRESS ? parsedAmountIn: 0n;
                                            const nativeIn = nativeAmount + feePath.nativeIn;
                                          
                                            const params = {
                                              tokenIn: tokenIn.toString(), 
                                              tokenOut: tokenOut.toString(), 
                                              fee: fee,
                                              recipient: account?.address || "",
                                              amountIn: parsedAmountIn,
                                              amountOutMinimum: amountOutBigInt,
                                              sqrtPriceLimitX96:0n,
                    
                                            };
                                            console.log("router",router)
                                            
                                           
                    
                            return           prepareContractCall({
                                         contract: getContract({client,
                                                chain: NETWORK,
                                                address: routerPlasma,}),
                                              method: 
                                              "function exactInputSingle((address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96) params, (address feeRecipient, address tokenIn, uint256 amountIn, uint256 nativeIn) feeParams, address router, bool swapRouterV2, bool SwapToNative) payable returns (uint256 amount)",
                                              params: [params, feePath, router,true, swapToNative],
                                              value: nativeIn,
                                              gas: 600000n,
                                              gasPrice: gasPrice,
                                              type: "eip1559",
                                              maxFeePerGas: gasPrice,
                                              maxPriorityFeePerGas: gasPrice,
                                            });
                                            setMessage("📤 Transaction sent. Waiting for confirmation...");
                
                          }}
                          disabled={loading} // ✅ Disable while processing
                
                          onTransactionSent={() => {
                            setMessage("📤 Swap transaction sent. Waiting for confirmation...");
                          }}
                          onError={(error) => {
                            setLoading(false);
                            setMessage("❌ Swap failed. Please try again.");
                            console.error("Transaction error:", error);
                          }}
                          onTransactionConfirmed={(txResult) => {
                            setLoading(false);
                            setMessage(
                              `✅ Swap Successful! 🎉 <br />
                              <a href="https://www.ioPlasmaVerse.com/transactionHash/${chainId}/${txResult.transactionHash}" 
                                 target="_blank" 
                                 style="color: #61dafb; text-decoration: underline;">
                              View Transaction</a>`
                            );
                          }}
                        >
                        {loading ? "Swapping..." :  `Swap to ${tokenB?.name}`}
                    
                        </TransactionButton>
                           ) : dexStep === "Quickswap" ? (
                    
                            <TransactionButton
                            transaction={async () => {
                              setLoading(true);
                              setMessage("⏳ Preparing swap transaction...");
                             
                              const parsedAmountIn = BigInt(
                                Math.round(Number(amountIn) * 10 ** tokenA?.decimals)
                              );  
                      
                                       
                              console.log("router",router)
                              console.log("amountIn", parsedAmountIn)
                              const tokenIn = tokenA.contractAddress == NATIVE_TOKEN_ADDRESS ? WETH9: tokenA.contractAddress;
                                            const tokenOut = tokenB.contractAddress == NATIVE_TOKEN_ADDRESS ? WETH9: tokenB.contractAddress;
                                            const swapToNative = tokenB.contractAddress == NATIVE_TOKEN_ADDRESS ? true: false;
                                              const nativeAmount = tokenA.contractAddress == NATIVE_TOKEN_ADDRESS ? parsedAmountIn: 0n;
                                              const nativeIn = nativeAmount + feePath.nativeIn;
                                              const params = {
                                                tokenIn: tokenIn.toString(), 
                                                tokenOut: tokenOut.toString(), 
                                                fee: fee,
                                                recipient: account?.address || "",
                                                amountIn: parsedAmountIn,
                                                amountOutMinimum: amountOutBigInt,
                                                sqrtPriceLimitX96:0n,
                    
                                              };
                                              
                    
                              return           prepareContractCall({
                                          contract: getContract({client,
                                                  chain: NETWORK,
                                                  address: routerPlasma,}),
                                                method: 
                                                "function exactInputSingle((address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96) params, (address feeRecipient, address tokenIn, uint256 amountIn, uint256 nativeIn) feeParams, address router, bool swapRouterV2, bool SwapToNative) payable returns (uint256 amount)",
                                                params: [params, feePath, router,false, swapToNative],
                                                value: nativeIn,
                                                gas: 1000000n,
                                                gasPrice: gasPrice,
                                                type: "eip1559",
                                                maxFeePerGas: gasPrice,
                                                maxPriorityFeePerGas: gasPrice,                              });
                                              setMessage("📤 Transaction sent. Waiting for confirmation...");
                
                            }}
                            disabled={loading} // ✅ Disable while processing
                
                            onTransactionSent={() => {
                              setMessage("📤 Swap transaction sent. Waiting for confirmation...");
                            }}
                            onError={(error) => {
                              setLoading(false);
                              setMessage("❌ Swap failed. Please try again.");
                              console.error("Transaction error:", error);
                            }}
                            onTransactionConfirmed={(txResult) => {
                              setLoading(false);
                              setMessage(
                                `✅ Swap Successful! 🎉 <br />
                                <a href="https://www.ioPlasmaVerse.com/transactionHash/${chainId}/${txResult.transactionHash}" 
                                   target="_blank" 
                                   style="color: #61dafb; text-decoration: underline;">
                                View Transaction</a>`
                              );
                            }}
                        >
                        {loading ? "Swapping..." :  `Swap to ${tokenB?.name}`}
                    
                        </TransactionButton>
                          ) : dexStep === "QuickswapMulti" ? (
                    
                            <TransactionButton
                            transaction={async () => {
                              setLoading(true);
                              setMessage("⏳ Preparing swap transaction...");
                             
                              const parsedAmountIn = BigInt(
                                Math.round(Number(amountIn) * 10 ** tokenA?.decimals)
                              );  
                      
                                       
                              console.log("router",router)
                              console.log("amountIn", parsedAmountIn)
                              const tokenIn = tokenA.contractAddress == NATIVE_TOKEN_ADDRESS ? WETH9: tokenA.contractAddress;
                                            const tokenOut = tokenB.contractAddress == NATIVE_TOKEN_ADDRESS ? WETH9: tokenB.contractAddress;
                                            const swapToNative = tokenB.contractAddress == NATIVE_TOKEN_ADDRESS ? true: false;
                                              const nativeAmount = tokenA.contractAddress == NATIVE_TOKEN_ADDRESS ? parsedAmountIn: 0n;
                                              const nativeIn = nativeAmount + feePath.nativeIn;
                                              const params = {
                                                path: bestRoute, // Example tokenIn address
                                                recipient: account?.address || "",
                                                amountIn: amountInBigInt,
                                                amountOutMinimum: amountOutBigInt,
                                                tokenIn: tokenIn,
                                                tokenOut: tokenOut,
                                                swapToNative: swapToNative
                                              };
                                              
                                            
                    
                              return           prepareContractCall({
                                          contract: getContract({client,
                                                  chain: NETWORK,
                                                  address: routerPlasma,}),
                                                method: 
                                                "function exactInput((bytes path, address recipient, uint256 amountIn, uint256 amountOutMinimum, address tokenIn, address tokenOut, bool swapToNative) params, (address feeRecipient, address tokenIn, uint256 amountIn, uint256 nativeIn) feeParams, address router, bool swapRouterV2) payable returns (uint256 amount)",
                                                params: [params, feePath, router, false],
                                                value: nativeIn,
                                                gas: 1000000n,
                                                gasPrice: gasPrice,
                                                type: "eip1559",
                                                maxFeePerGas: gasPrice,
                                                maxPriorityFeePerGas: gasPrice,                              });
                                              setMessage("📤 Transaction sent. Waiting for confirmation...");
                
                            }}
                            disabled={loading} // ✅ Disable while processing
                
                            onTransactionSent={() => {
                              setMessage("📤 Swap transaction sent. Waiting for confirmation...");
                            }}
                            onError={(error) => {
                              setLoading(false);
                              setMessage("❌ Swap failed. Please try again.");
                              console.error("Transaction error:", error);
                            }}
                            onTransactionConfirmed={(txResult) => {
                              setLoading(false);
                              setMessage(
                                `✅ Swap Successful! 🎉 <br />
                                <a href="https://www.ioPlasmaVerse.com/transactionHash/${chainId}/${txResult.transactionHash}" 
                                   target="_blank" 
                                   style="color: #61dafb; text-decoration: underline;">
                                View Transaction</a>`
                              );
                            }}
                        >
                        {loading ? "Swapping..." :  `Swap to ${tokenB?.name}`}
                    
                        </TransactionButton>
                        ) : (
                          <TransactionButton
                          transaction={async () => {
                            setLoading(true);
                            setMessage("⏳ Preparing swap transaction...");
                           
                            const parsedAmountIn = BigInt(
                              Math.round(Number(amountIn) * 10 ** tokenA?.decimals)
                            );  
                    
                           
                           
                                           const swapToNative = tokenB.contractAddress == NATIVE_TOKEN_ADDRESS ? true: false;
                                            const route: TupleType = bestRoute;
                                            const routes = route?.map((entry) => {
                                              const [from, to, stable, factory] = entry; // Explicit destructuring
                                              return {
                                                from:from, // Ensure it's a string
                                                to: to,     // Ensure it's a string
                                                stable:stable, // Ensure it's a boolean
                                                factory: factory, // Ensure it's a string
                                              };
                                            }) || [];
                                            
                                            
                                            // Ensure the routes array has the correct structure
                                            if (routes.some(route => typeof route.from !== "string" || typeof route.to !== "string")) {
                                              throw new Error("Invalid route structure.");
                                            }
                                            
                                          const nativeAmount = tokenA.contractAddress == NATIVE_TOKEN_ADDRESS ? parsedAmountIn: 0n;
                                          const nativeIn = nativeAmount + feePath.nativeIn;
                
                            return          prepareContractCall({
                              contract: getContract({client,
                                chain: NETWORK,
                                address: routerPlasma,}),
                              method: 
                              "function swapExactTokensForTokensVeldrome(uint256 amountIn, uint256 amountOutMin, (address from, address to, bool stable, address factory)[] routes, (address feeRecipient, address tokenIn, uint256 amountIn, uint256 nativeIn) feeParams, address to, address router, uint256 nativeIn, bool SwapToNative) payable returns (uint256[] amountOut)",
                              params: [parsedAmountIn, amountOutBigInt, routes, feePath, account?.address || "", router,nativeIn , swapToNative],
                              value: nativeIn,
                              gas: 1000000n,
                              gasPrice: gasPrice,
                              type: "eip1559",
                              maxFeePerGas: gasPrice,
                              maxPriorityFeePerGas: gasPrice,            });
                            setMessage("📤 Transaction sent. Waiting for confirmation...");
                
                          }}
                          disabled={loading} // ✅ Disable while processing
                
                          onTransactionSent={() => {
                            setMessage("📤 Swap transaction sent. Waiting for confirmation...");
                          }}
                          onError={(error) => {
                            setLoading(false);
                            setMessage("❌ Swap failed. Please try again.");
                            console.error("Transaction error:", error);
                          }}
                          onTransactionConfirmed={(txResult) => {
                            setLoading(false);
                            setMessage(
                              `✅ Swap Successful! 🎉 <br />
                              <a href="https://www.ioPlasmaVerse.com/transactionHash/${chainId}/${txResult.transactionHash}" 
                                 target="_blank" 
                                 style="color: #61dafb; text-decoration: underline;">
                              View Transaction</a>`
                            );
                          }}
                        >
                        {loading ? "Swapping..." :  `Swap to ${tokenB?.name}`}
                    
                        </TransactionButton>
                        )}
                      </div>
                              )}  
                
                
                              
                
                
                              {buyingStep === "confirm" && currentFrom === "B" && tokenA && tokenB && (
                      <div>
                        {dexStep === "WrappedContract" && tokenA.contractAddress.toLowerCase() === WETH9.toLowerCase() ? (
                          <TransactionButton
                          transaction={async () => {
                            setLoading(true);
                            setMessage("⏳ Preparing swap transaction...");                      
                            return prepareContractCall({
                              contract: getContract({ client: client,chain:defineChain(chainId), address:WETH9}),
                              method: "function withdraw(uint256 wed) payable",
                              params: [BigInt(Number(amountIn) * 10 ** 18)],
                              gas:500000n,
                              gasPrice: gasPrice,
                            })
                            setMessage("📤 Transaction sent. Waiting for confirmation...");
                
                          }}
                          disabled={loading} // ✅ Disable while processing
                
                          onTransactionSent={() => {
                            setMessage("📤 Swap transaction sent. Waiting for confirmation...");
                          }}
                          onError={(error) => {
                            setLoading(false);
                            setMessage("❌ Swap failed. Please try again.");
                            console.error("Transaction error:", error);
                          }}
                          onTransactionConfirmed={(txResult) => {
                            setLoading(false);
                            setMessage(
                              `✅ Swap Successful! 🎉 <br />
                              <a href="https://www.ioPlasmaVerse.com/transactionHash/${chainId}/${txResult.transactionHash}" 
                                 target="_blank" 
                                 style="color: #61dafb; text-decoration: underline;">
                              View Transaction</a>`
                            );
                          }}
                          
                        >
                        {loading ? "Swapping..." :  `Swap to ${tokenB?.name}`}
                    
                        </TransactionButton>
                        ) : tokenB.contractAddress.toLowerCase() === WETH9.toLowerCase() && dexStep === "WrappedContract" ? (
                          <TransactionButton  
                          transaction={async () => {
                            setLoading(true);
                            setMessage("⏳ Preparing swap transaction..."); 
                            return prepareContractCall({
                              contract: getContract({ client: client,chain:defineChain(chainId), address:WETH9}),
                              method: "function deposit() payable",
                              value: BigInt(Number(amountIn) * 10 ** 18),
                              gas:500000n,
                              gasPrice: gasPrice,
                              type: "eip1559",
                              maxFeePerGas: gasPrice,
                              maxPriorityFeePerGas: gasPrice,            })                     
                            setMessage("📤 Transaction sent. Waiting for confirmation...");
                
                          }}
                          disabled={loading} // ✅ Disable while processing
                
                          onTransactionSent={() => {
                            setMessage("📤 Swap transaction sent. Waiting for confirmation...");
                          }}
                          onError={(error) => {
                            setLoading(false);
                            setMessage("❌ Swap failed. Please try again.");
                            console.error("Transaction error:", error);
                          }}
                          onTransactionConfirmed={(txResult) => {
                            setLoading(false);
                            setMessage(
                              `✅ Swap Successful! 🎉 <br />
                              <a href="https://www.ioPlasmaVerse.com/transactionHash/${chainId}/${txResult.transactionHash}" 
                                 target="_blank" 
                                 style="color: #61dafb; text-decoration: underline;">
                              View Transaction</a>`
                            );
                          }}
                          
                        >
                        {loading ? "Swapping..." :  `Swap to ${tokenB?.name}`}
                    
                        </TransactionButton>
                        
                        ) : dexStep === "Uniswapv2" ? (
                          <TransactionButton
                          transaction={async () => {
                            setLoading(true);
                            setMessage("⏳ Preparing swap transaction...");
                            
                            const parsedAmountIn = BigInt(
                              Math.round(Number(amountIn) * 10 ** tokenA?.decimals)
                            ); 
                            
                            const parsedAmountOut = BigInt(
                              Math.round(Number(amountOut) * 10 ** tokenA?.decimals)
                            ); 
                    
                            
                                           const swapToNative = tokenB.contractAddress == NATIVE_TOKEN_ADDRESS ? true: false;
                                            console.log("fee",fee)
                                            const nativeAmount = tokenA.contractAddress == NATIVE_TOKEN_ADDRESS ? amountInBigInt: 0n;
                                            const nativeIn = nativeAmount + feePath.nativeIn;
                                              const minutes = 5; // Set deadline duration (5 minutes)
                                              const deadline = Math.floor(Date.now() / 1000) + minutes * 60;
                                            const path =  
                                            {
                                             path: bestRoute, 
                                             SwapToNative: swapToNative,
                                             factory: factory
                   
                                           };
                                            
                                                  
                                          return  prepareContractCall({
                              contract: getContract({client,
                                chain: NETWORK,
                                address: routerPlasma}),
                              method: 
                              "function swapTokensForExactTokens(uint256 amountOut, uint256 amountInMaximum, (address[] path, bool SwapToNative, address factory) path, (address feeRecipient, address tokenIn, uint256 amountIn, uint256 nativeIn) feeParams, address to, uint256 deadline) payable returns (uint256 amountIn)",
                              params: [parsedAmountOut,amountInBigInt, path, feePath, account?.address || "", BigInt(deadline)],
                              value: nativeIn,
                              gas: 1000000n,
                              gasPrice: gasPrice,
                              type: "eip1559",
                              maxFeePerGas: gasPrice,
                              maxPriorityFeePerGas: gasPrice,
                            });
                            setMessage("📤 Transaction sent. Waiting for confirmation...");
                
                          }}
                          disabled={loading} // ✅ Disable while processing
                
                          onTransactionSent={() => {
                            setMessage("📤 Swap transaction sent. Waiting for confirmation...");
                          }}
                          onError={(error) => {
                            setLoading(false);
                            setMessage("❌ Swap failed. Please try again.");
                            console.error("Transaction error:", error);
                          }}
                          onTransactionConfirmed={(txResult) => {
                            setLoading(false);
                            setMessage(
                              `✅ Swap Successful! 🎉 <br />
                              <a href="https://www.ioPlasmaVerse.com/transactionHash/${chainId}/${txResult.transactionHash}" 
                                 target="_blank" 
                                 style="color: #61dafb; text-decoration: underline;">
                              View Transaction</a>`
                            );
                          }}
                          
                        >
                        {loading ? "Swapping..." :  `Swap to ${tokenB?.name}`}
                    
                        </TransactionButton>
                        ) : dexStep === "UniswapV3Multi" ? (
                          <TransactionButton
                          transaction={async () => {
                            setLoading(true);
                            setMessage("⏳ Preparing swap transaction...");
                            
                            const parsedAmountIn = BigInt(
                              Math.round(Number(amountIn) * 10 ** tokenA?.decimals)
                            );  
                            const parsedAmountOut = BigInt(
                              Math.round(Number(amountOut) * 10 ** tokenA?.decimals)
                            );  
                           
                            const tokenIn = tokenA.contractAddress == NATIVE_TOKEN_ADDRESS ? WETH9: tokenA.contractAddress;
                                           const tokenOut = tokenB.contractAddress == NATIVE_TOKEN_ADDRESS ? WETH9: tokenB.contractAddress;
                                           const swapToNative = tokenB.contractAddress == NATIVE_TOKEN_ADDRESS ? true: false;
                                            console.log("fee",fee)
                                            const nativeAmount = tokenA.contractAddress == NATIVE_TOKEN_ADDRESS ? amountInBigInt: 0n;
                                            const nativeIn = nativeAmount + feePath.nativeIn;
                                            const params = {
                                              path: bestRoute, // Example tokenIn address
                                              recipient: account?.address || "",
                                              amountOut: parsedAmountOut,
                                              amountInMaximum: amountInBigInt,                            
                                              tokenIn: tokenIn,
                                              tokenOut: tokenOut,
                                              swapToNative: swapToNative
                                            };
                                           
                                        
                    
                            return           prepareContractCall({
                                              contract: getContract({client,
                                                chain: NETWORK,
                                                address: routerPlasma,}),
                                              method: 
                                              "function exactOutput((bytes path, address recipient, uint256 amountOut, uint256 amountInMaximum, address tokenIn, address tokenOut, bool swapToNative) params, (address feeRecipient, address tokenIn, uint256 amountIn, uint256 nativeIn) feeParams, address router, bool swapRouterV2) payable returns (uint256 amount)",
                                              params: [params, feePath, router, true],
                                              value: nativeIn,
                                              gas: 1000000n,
                                              gasPrice: gasPrice,
                                              type: "eip1559",
                                              maxFeePerGas: gasPrice,
                                              maxPriorityFeePerGas: gasPrice,    
                                                });
                                                setMessage("📤 Transaction sent. Waiting for confirmation...");
                
                          }}
                          disabled={loading} // ✅ Disable while processing
                
                          onTransactionSent={() => {
                            setMessage("📤 Swap transaction sent. Waiting for confirmation...");
                          }}
                          onError={(error) => {
                            setLoading(false);
                            setMessage("❌ Swap failed. Please try again.");
                            console.error("Transaction error:", error);
                          }}
                          onTransactionConfirmed={(txResult) => {
                            setLoading(false);
                            setMessage(
                              `✅ Swap Successful! 🎉 <br />
                              <a href="https://www.ioPlasmaVerse.com/transactionHash/${chainId}/${txResult.transactionHash}" 
                                 target="_blank" 
                                 style="color: #61dafb; text-decoration: underline;">
                              View Transaction</a>`
                            );
                          }}
                        >
                        {loading ? "Swapping..." :  `Swap to ${tokenB?.name}`}
                    
                        </TransactionButton>
                        ) : dexStep === "UniswapV3Single" ? (
                          <TransactionButton
                          transaction={async () => {
                            setLoading(true);
                            setMessage("⏳ Preparing swap transaction...");
                            const parsedAmountIn = BigInt(
                              Math.round(Number(amountIn) * 10 ** tokenA?.decimals)
                            );  
                            const parsedAmountOut = BigInt(
                              Math.round(Number(amountOut) * 10 ** tokenA?.decimals)
                            ); 
                             
                    
                           
                            const tokenIn = tokenA.contractAddress == NATIVE_TOKEN_ADDRESS ? WETH9: tokenA.contractAddress;
                                           const tokenOut = tokenB.contractAddress == NATIVE_TOKEN_ADDRESS ? WETH9: tokenB.contractAddress;
                                           const swapToNative = tokenB.contractAddress == NATIVE_TOKEN_ADDRESS ? true: false;
                                           const nativeAmount = tokenA.contractAddress == NATIVE_TOKEN_ADDRESS ? parsedAmountIn: 0n;
                                           const nativeIn = nativeAmount + feePath.nativeIn;
                                          
                                            const params = {
                                              tokenIn: tokenIn.toString(), 
                                              tokenOut: tokenOut.toString(), 
                                              fee: fee,
                                              recipient: account?.address || "",
                                              amountOut: parsedAmountOut,
                                              amountInMaximum: amountInBigInt,
                                              sqrtPriceLimitX96:0n,
                    
                                            };
                                            console.log("router",router)
                                            
                    
                            return           prepareContractCall({
                                         contract: getContract({client,
                                                chain: NETWORK,
                                                address: routerPlasma,}),
                                              method: 
                                              "function exactOutputSingle((address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 amountOut, uint256 amountInMaximum, uint160 sqrtPriceLimitX96) params, (address feeRecipient, address tokenIn, uint256 amountIn, uint256 nativeIn) feeParams, address router, bool swapRouterV2, bool SwapToNative) payable returns (uint256 amount)",
                                              params: [params, feePath, router,true, swapToNative],
                                              value: nativeIn,
                                              gas: 600000n,
                                              gasPrice: gasPrice,
                                              type: "eip1559",
                                              maxFeePerGas: gasPrice,
                                              maxPriorityFeePerGas: gasPrice,
                                            });
                                            setMessage("📤 Transaction sent. Waiting for confirmation...");
                
                          }}
                          disabled={loading} // ✅ Disable while processing
                
                          onTransactionSent={() => {
                            setMessage("📤 Swap transaction sent. Waiting for confirmation...");
                          }}
                          onError={(error) => {
                            setLoading(false);
                            setMessage("❌ Swap failed. Please try again.");
                            console.error("Transaction error:", error);
                          }}
                          onTransactionConfirmed={(txResult) => {
                            setLoading(false);
                            setMessage(
                              `✅ Swap Successful! 🎉 <br />
                              <a href="https://www.ioPlasmaVerse.com/transactionHash/${chainId}/${txResult.transactionHash}" 
                                 target="_blank" 
                                 style="color: #61dafb; text-decoration: underline;">
                              View Transaction</a>`
                            );
                          }}
                        >
                        {loading ? "Swapping..." :  `Swap to ${tokenB?.name}`}
                    
                        </TransactionButton>
                           ) : dexStep === "Quickswap" ? (
                    
                            <TransactionButton
                            transaction={async () => {
                              setLoading(true);
                              setMessage("⏳ Preparing swap transaction...");
                             
                              const parsedAmountIn = BigInt(
                                Math.round(Number(amountIn) * 10 ** tokenA?.decimals)
                              );  
                              const parsedAmountOut = BigInt(
                                Math.round(Number(amountOut) * 10 ** tokenA?.decimals)
                              ); 
                      
                                       
                              console.log("router",router)
                              console.log("amountIn", parsedAmountIn)
                              const tokenIn = tokenA.contractAddress == NATIVE_TOKEN_ADDRESS ? WETH9: tokenA.contractAddress;
                                            const tokenOut = tokenB.contractAddress == NATIVE_TOKEN_ADDRESS ? WETH9: tokenB.contractAddress;
                                            const swapToNative = tokenB.contractAddress == NATIVE_TOKEN_ADDRESS ? true: false;
                                              const nativeAmount = tokenA.contractAddress == NATIVE_TOKEN_ADDRESS ? amountInBigInt: 0n;
                                              const nativeIn = nativeAmount + feePath.nativeIn;
                                              const params = {
                                                tokenIn: tokenIn.toString(), 
                                                tokenOut: tokenOut.toString(), 
                                                fee: fee,
                                                recipient: account?.address || "",
                                                amountOut: parsedAmountOut,
                                                amountInMaximum: amountInBigInt,
                                                sqrtPriceLimitX96:0n,
                    
                                              };
                                              
                                              
                                            
                    
                              return           prepareContractCall({
                                          contract: getContract({client,
                                                  chain: NETWORK,
                                                  address: routerPlasma,}),
                                                method: 
                                                "function exactOutputSingle((address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 amountOut, uint256 amountInMaximum, uint160 sqrtPriceLimitX96) params, (address feeRecipient, address tokenIn, uint256 amountIn, uint256 nativeIn) feeParams, address router, bool swapRouterV2, bool SwapToNative) payable returns (uint256 amount)",
                                                params: [params, feePath, router,false, swapToNative],
                                                value: nativeIn,
                                                gas: 60000n,
                                                gasPrice: gasPrice,
                                                type: "eip1559",
                                                maxFeePerGas: gasPrice,
                                                maxPriorityFeePerGas: gasPrice,                              });
                                              setMessage("📤 Transaction sent. Waiting for confirmation...");
                
                            }}
                            disabled={loading} // ✅ Disable while processing
                
                            onTransactionSent={() => {
                              setMessage("📤 Swap transaction sent. Waiting for confirmation...");
                            }}
                            onError={(error) => {
                              setLoading(false);
                              setMessage("❌ Swap failed. Please try again.");
                              console.error("Transaction error:", error);
                            }}
                            onTransactionConfirmed={(txResult) => {
                              setLoading(false);
                              setMessage(
                                `✅ Swap Successful! 🎉 <br />
                                <a href="https://www.ioPlasmaVerse.com/transactionHash/${chainId}/${txResult.transactionHash}" 
                                   target="_blank" 
                                   style="color: #61dafb; text-decoration: underline;">
                                View Transaction</a>`
                              );
                            }}
                        >
                        {loading ? "Swapping..." :  `Swap to ${tokenB?.name}`}
                    
                        </TransactionButton>
                        ) : dexStep === "QuickswapMulti" ? (
                    
                          <TransactionButton
                          transaction={async () => {
                            setLoading(true);
                            setMessage("⏳ Preparing swap transaction...");
                           
                            const parsedAmountIn = BigInt(
                              Math.round(Number(amountIn) * 10 ** tokenA?.decimals)
                            );  
                            const parsedAmountOut = BigInt(
                              Math.round(Number(amountOut) * 10 ** tokenA?.decimals)
                            ); 
                    
                                     
                            console.log("router",router)
                            console.log("amountIn", parsedAmountIn)
                            const tokenIn = tokenA.contractAddress == NATIVE_TOKEN_ADDRESS ? WETH9: tokenA.contractAddress;
                                          const tokenOut = tokenB.contractAddress == NATIVE_TOKEN_ADDRESS ? WETH9: tokenB.contractAddress;
                                          const swapToNative = tokenB.contractAddress == NATIVE_TOKEN_ADDRESS ? true: false;
                                            const nativeAmount = tokenA.contractAddress == NATIVE_TOKEN_ADDRESS ? amountInBigInt: 0n;
                                            const nativeIn = nativeAmount + feePath.nativeIn;
                                            const params = {
                                              path: bestRoute, // Example tokenIn address
                                              recipient: account?.address || "",
                                              amountOut: parsedAmountOut,
                                              amountInMaximum: amountInBigInt,
                                              tokenIn: tokenIn,
                                              tokenOut: tokenOut,
                                              swapToNative: swapToNative
                  
                                            };
                                            
                                            
                                          
                  
                            return           prepareContractCall({
                                        contract: getContract({client,
                                                chain: NETWORK,
                                                address: routerPlasma,}),
                                              method: 
                                              "function exactOutput((bytes path, address recipient, uint256 amountOut, uint256 amountInMaximum, address tokenIn, address tokenOut, bool swapToNative) params, (address feeRecipient, address tokenIn, uint256 amountIn, uint256 nativeIn) feeParams, address router, bool swapRouterV2) payable returns (uint256 amount)",
                                               params: [params, feePath, router, false],
                                              value: nativeIn,
                                              gas: 60000n,
                                              gasPrice: gasPrice,
                                              type: "eip1559",
                                              maxFeePerGas: gasPrice,
                                              maxPriorityFeePerGas: gasPrice,                            });
                                            setMessage("📤 Transaction sent. Waiting for confirmation...");
                
                          }}
                          disabled={loading} // ✅ Disable while processing
                
                          onTransactionSent={() => {
                            setMessage("📤 Swap transaction sent. Waiting for confirmation...");
                          }}
                          onError={(error) => {
                            setLoading(false);
                            setMessage("❌ Swap failed. Please try again.");
                            console.error("Transaction error:", error);
                          }}
                          onTransactionConfirmed={(txResult) => {
                            setLoading(false);
                            setMessage(
                              `✅ Swap Successful! 🎉 <br />
                              <a href="https://www.ioPlasmaVerse.com/transactionHash/${chainId}/${txResult.transactionHash}" 
                                 target="_blank" 
                                 style="color: #61dafb; text-decoration: underline;">
                              View Transaction</a>`
                            );
                          }}
                      >
                      {loading ? "Swapping..." :  `Swap to ${tokenB?.name}`}
                  
                      </TransactionButton>
                        ) : (
                          <TransactionButton
                          transaction={async () => {
                            setLoading(true);
                            setMessage("⏳ Preparing swap transaction...");
                           
                            const parsedAmountIn = BigInt(
                              Math.round(Number(amountIn) * 10 ** tokenA?.decimals)
                            );  
                    
                           
                           
                                           const swapToNative = tokenB.contractAddress == NATIVE_TOKEN_ADDRESS ? true: false;
                                            const route: TupleType = bestRoute;
                                            const routes = route?.map((entry) => {
                                              const [from, to, stable, factory] = entry; // Explicit destructuring
                                              return {
                                                from:from, // Ensure it's a string
                                                to: to,     // Ensure it's a string
                                                stable:stable, // Ensure it's a boolean
                                                factory: factory, // Ensure it's a string
                                              };
                                            }) || [];
                                            
                                            
                                            // Ensure the routes array has the correct structure
                                            if (routes.some(route => typeof route.from !== "string" || typeof route.to !== "string")) {
                                              throw new Error("Invalid route structure.");
                                            }
                                            
                                          const nativeAmount = tokenA.contractAddress == NATIVE_TOKEN_ADDRESS ? amountInBigInt: 0n;
                                          const nativeIn = nativeAmount + feePath.nativeIn;
                                
                    
                    
                            return          prepareContractCall({
                              contract: getContract({client,
                                chain: NETWORK,
                                address: routerPlasma,}),
                              method: 
                              "function swapExactTokensForTokensVeldrome(uint256 amountIn, uint256 amountOutMin, (address from, address to, bool stable, address factory)[] routes, (address feeRecipient, address tokenIn, uint256 amountIn, uint256 nativeIn) feeParams, address to, address router, uint256 nativeIn, bool SwapToNative) payable returns (uint256[] amountOut)",
                              params: [parsedAmountIn, 0n, routes, feePath, account?.address || "", router,nativeIn , swapToNative],
                              value: nativeIn,
                              gas: 1000000n,
                              gasPrice: gasPrice,
                              type: "eip1559",
                              maxFeePerGas: gasPrice,
                              maxPriorityFeePerGas: gasPrice,            });
                            setMessage("📤 Transaction sent. Waiting for confirmation...");
                
                          }}
                          disabled={loading} // ✅ Disable while processing
                
                          onTransactionSent={() => {
                            setMessage("📤 Swap transaction sent. Waiting for confirmation...");
                          }}
                          onError={(error) => {
                            setLoading(false);
                            setMessage("❌ Swap failed. Please try again.");
                            console.error("Transaction error:", error);
                          }}
                          onTransactionConfirmed={(txResult) => {
                            setLoading(false);
                            setMessage(
                              `✅ Swap Successful! 🎉 <br />
                              <a href="https://www.ioPlasmaVerse.com/transactionHash/${chainId}/${txResult.transactionHash}" 
                                 target="_blank" 
                                 style="color: #61dafb; text-decoration: underline;">
                              View Transaction</a>`
                            );
                          }}
                        >
                        {loading ? "Swapping..." :  `Swap to ${tokenB?.name}`}
                    
                        </TransactionButton>
                        )}
                        </div>
              )} 
    
                {/* Fast Transaction Switch */}
                <Switch
                  checked={isFast}
                  onChange={(event: any) => setIsFast(event.currentTarget.checked)}
                  label={isFast ? "Fast Transaction (1.8 Qev)" : "Base Transaction (1 Qev)"}
                  size="md"
                />
              </Box>


            )}
            <Card
            shadow="sm"
            radius="md"
            style={{
              width: "98%",
              backgroundColor: "rgba(255, 255, 255, 0.05)",
              color: "white",
              padding: "1rem",
              margin: "auto",
              textAlign: "center",
            }}
          >
            <Title order={4} style={{ color: "#61dafb", marginBottom: "10px" }}>
              🔄 Swap Route Details
            </Title>

            {/* Routing Information */}
            <Text size="sm" style={{ opacity: 0.8 }}>
              Swap will be routed via <strong>{dexStep || "Unknown"}</strong>
            </Text>

            <Divider my="sm" />

            {/* Token Swap Details */}
            <Group justify="apart">
              <Text size="md">
                <strong>{amountIn || "0"} {tokenA.symbol}</strong> 
                <br />
                ≈ ${((Number(amountIn) || 0) * (Number(tokenA.price) || 0)).toFixed(2)}
              </Text>
              <Text>➡️</Text>
              <Text size="md">
                <strong>{amountOut || "0"} {tokenB.symbol}</strong> 
                <br />
                ≈ ${((Number(amountOut) || 0) * (Number(tokenB.price) || 0)).toFixed(2)}
              </Text>
            </Group>

            <Divider my="sm" />

            {/* Estimated Exchange Rate */}
            <Text size="sm" style={{ opacity: 0.8 }}>
              <strong>1 {tokenA.symbol}</strong> ≈ {(Number(amountOut) / Number(amountIn) || 0).toFixed(6)} {tokenB.symbol}
            </Text>
          </Card>
          </Card>
        </Box>

        <Divider my="sm" style={{ borderColor: "#61dafb", paddingBottom: "70px" }} />
      </div>
    );
            };
      
      export default SwapInterface;