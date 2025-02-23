"use client";


/**
 * **CurrencyProvider Component**
 * -----------------------------------
 * **Purpose:**
 * - Manages blockchain **token balances**, **marketplace contracts**, and **native balances**.
 * - Provides **context** for accessing currency-related data.
 *
 * **Context Values:**
 * @param {function} updateBalances - Fetches and updates token balances.
 * @param {string} router - Address of the Uniswap V2 Router contract.
 * @param {Token[]} tokenList - List of available ERC-20 tokens.
 * @param {TokenDataGecko2[]} tokenListData - Token metadata including prices.
 * @param {function} setTokenList - Function to update the token list.
 * @param {Token[]} tokenBalances - User's token balances.
 * @param {number} chainId - The blockchain network ID.
 * @param {string} nftCollection - NFT Collection contract address.
 * @param {string} WETH9 - Wrapped Ethereum contract address.
 * @param {string} feeReciever - Address of the fee recipient.
 * @param {Chain2} chainData - Blockchain network details.
 * @param {ThirdwebContract} marketplace - Marketplace contract instance.
 * @param {function} setChainId - Function to update the current chain ID.
 *
 * **Features:**
 * - ✅ Fetches and stores **token balances**.
 * - ✅ Retrieves **marketplace contract** details.
 * - ✅ Updates **exchange rates & balances** dynamically.
 */


import React, { createContext, useContext, useState, FC, ReactNode, useEffect, useCallback } from 'react';
import { ADDRESS_ZERO, defineChain, eth_getBalance, getContract, getRpcClient, readContract, ThirdwebContract } from 'thirdweb';
import { useActiveAccount } from 'thirdweb/react';
import { UNISWAP_CONTRACTS } from '../components/types';
import { client } from "@/app/constants";
import { ChainList as FullChainList } from '../components/chainList';



interface CurrencyContextProps {
  updateBalances: (chainId: number) => void;
  router:string;
  tokenList: Token[];
  tokenListData: TokenDataGecko2[];
  setTokenList: React.Dispatch<React.SetStateAction<Token[]>>; 
  tokenBalances: Token[];
  chainId: number;
  nftCollection:string;
  WETH9: string;
  feeReciever: string;
  chainData: Chain2;
  marketplace: ThirdwebContract;
  setChainId: React.Dispatch<React.SetStateAction<number>>;
}

const CurrencyContext = createContext<CurrencyContextProps | undefined>(undefined);



type Token = {
  name: string;
  symbol: string;
  contractAddress: string;
  image: string;
  chainId?: number;
  price?: string;
  value?: string;
  balance?: string; 
  coinCecko?: string;
  hasTax?: boolean;
  decimals: number;
};


interface TokenDataGecko {
  data: TokenDataGecko2[]; 
}
interface TokenDataGecko2 {
  id: string;
  type: string;
  attributes: {
    address: string;
    name: string;
    symbol: string;
    decimals: number;
    image_url: string;
    coingecko_coin_id: string;
    total_supply: string;
    price_usd: string;
    fdv_usd: string;
    total_reserve_in_usd: string;
    volume_usd: {
      h24: string;
    };
    market_cap_usd: string;
  };
  relationships: {
    top_pools: {
      data: { id: string; type: string }[];
    };
  };
}

interface Explorer {
  name: string;
  url: string;
  standard: string;
}

interface Chain2 {
  name: string;
  chainId: number;
  explorer: Explorer; 
  symbol: string;
}

export const CurrencyProvider: FC<{ children: ReactNode }> = ({ children }) => {
    /** ✅ State Variables */

  const chainDataDefault: Chain2 = {
    name: "",
    chainId: 0,
    explorer: {
      name: "",
      url: "",
      standard: "",
    },
    symbol: "",
  };
  /* ---------------------------------------------------------------
     State Variables
  --------------------------------------------------------------- */ 
   
  const [WETH9, setWETH9] = useState<string>(ADDRESS_ZERO); 
  const [router, setRouter] = useState<string>(ADDRESS_ZERO); 
  const [chainId, setChainId] = useState<number>(4689); 
  const [chainData, setChainData] = useState<Chain2>(chainDataDefault);
  const [tokenList, setTokenList] = useState<Token[]>([]); 
  const [tokenListData, setTokenListData] = useState<TokenDataGecko2[]>([]);
  const account = useActiveAccount();
  const [tokenBalances, setTokenBalances] = useState<Token[]>([]);
  const [params, setParams] = useState({ userId: "", groupId: "", isAdmin: false, isFounder: false });
  const [marketplace, setMarketplaceContract] = useState<string>(ADDRESS_ZERO); 
  const [nftCollection, setNftCollection] = useState<string>(ADDRESS_ZERO); 
  const [feeReciever, setFeeReciever] = useState<string>(ADDRESS_ZERO); 
  const [ERC20, setERC20] = useState<string>(ADDRESS_ZERO); 
  const [groupData, setGroupData] = useState<any>(null);
  
  /* ---------------------------------------------------------------
     State Variables
  --------------------------------------------------------------- */ 
  const checkGroupExists = useCallback(async () => {
    try {
      console.log("Fetching group data for groupId:", params.groupId);
      const res = await fetch(`https://www.ioplasmaverse.com/api/groups/${params.groupId}`);
      console.log("Received response:", res);
      const data = await res.json();
      console.log("Response data:", data);
  
      if (res.ok) {
        console.log("Group exists. Updating state with group data.");
        setGroupData(data);
        setChainId(Number(data.chain_id));
        setNftCollection(data.nft_collection_address.toString());
        setFeeReciever(data.fee_receiver.toString());
        setERC20(data.erc20_address.toString())
      } else {
        console.error("Fetch unsuccessful. Status:", res.status, "Data:", data);
      }
    } catch (err) {
      console.error("Error fetching group data:", err);
    } finally {
      console.log("Finished checkGroupExists for groupId:", params.groupId);
    }
  }, [params.groupId]);
  
  /* ---------------------------------------------------------------
     Get GroupData
  --------------------------------------------------------------- */ 
  useEffect(() => {
    if (params.groupId) {
      checkGroupExists();
    }
  }, [params.groupId, checkGroupExists]);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    setParams({
      userId: searchParams.get("userId") || "",
      groupId: searchParams.get("groupId") || "",
      isAdmin: searchParams.get("isAdmin")?.toLowerCase() === "true",
      isFounder: searchParams.get("isFounder")?.toLowerCase() === "true",
    });
  }, []);

  /* ---------------------------------------------------------------
     ** ✅ Update tokenBalance *
  --------------------------------------------------------------- */ 
        
  const updateBalances = useCallback(async (chainId: number) => {
    console.log("Updating balances for chainId:", chainId);

    if (tokenList.length < 2) {
        console.warn("Token list is empty or too short to update balances.");
        return;
    }
    console.log("Updating tokens for chainId:", tokenList);

    const chainData = Object.values(UNISWAP_CONTRACTS).find((data) => data.chainId === chainId);
    const chain = FullChainList.find((chain) => chain.chainId === chainId);

    if (!chainData) {
        console.error(`Chain data not found for chainId: ${chainId}`);
        return null;
    }

    const symbol = chainData.symbol;
    console.log("Chain data found:", chainData);

    const NATIVE_TOKEN_ADDRESS = chainId === 137 
        ? "0x0000000000000000000000000000000000001010" 
        : "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";
    const marketplace = chainData.MarketplaceContract;
    const WETH9 = chainData.wrappedAddress;
    const router = chainData.router;
    const nativeToken = chainData.nativeToken;
    const finalTokenList = [nativeToken, ...tokenList];

    console.log("tokenList tokens for chainId:", chainId, tokenList);

    try {
        const NETWORK = defineChain(chainId);

        // Fetch balances for all tokens
        const updatedTokens = await Promise.all(
            finalTokenList.map(async (token) => {
                try {
                    if (token.contractAddress === NATIVE_TOKEN_ADDRESS) {
                        const rpcRequest = getRpcClient({ client, chain: NETWORK });
                        const balanceNative = await eth_getBalance(rpcRequest, {
                            address: account?.address || ADDRESS_ZERO,
                        });

                        const adjustedNativeBalance = parseFloat(balanceNative.toString()) / 10 ** 18;
                        return { ...token, balance: adjustedNativeBalance.toFixed(6), hasBalance: adjustedNativeBalance > 0 };
                    } else {
                        const NETWORK2 = defineChain(4689);
                        const contract = getContract({ address: token.contractAddress.toString(), client, chain: NETWORK2 });

                        const balance = await readContract({
                            contract: contract,
                            method: "function balanceOf(address) view returns (uint256)",
                            params: [account?.address || ADDRESS_ZERO],
                        });

                        const adjustedBalance = parseFloat(balance.toString()) / 10 ** token.decimals;
                        return { ...token, balance: adjustedBalance.toFixed(6), hasBalance: adjustedBalance > 0 };
                    }
                } catch (error) {
                    console.error(`Error processing token ${token.name} (${token.contractAddress}):`, error);
                    return { ...token, balance: "0", hasBalance: false };
                }
            })
        );

        // Filter tokens with non-zero balance for price fetching
        const tokensWithBalance = updatedTokens.filter((token) => token.contractAddress !== NATIVE_TOKEN_ADDRESS);

        // Split the token list into batches of 30
        const chunkArray = (arr: any[], size: number) => {
            const chunks = [];
            for (let i = 0; i < arr.length; i += size) {
                chunks.push(arr.slice(i, i + size));
            }
            return chunks;
        };

        const tokenChunks = chunkArray(tokensWithBalance, 29);
        const priceData: TokenDataGecko2[] = [];

        // Fetch prices for each chunk
        for (const chunk of tokenChunks) {
            const contractAddresses = chunk
                .map((token) => token.contractAddress?.toLowerCase().trim())
                .join(",");

            const priceUrl = `https://api.geckoterminal.com/api/v2/networks/${symbol}/tokens/multi/${contractAddresses}`;
            console.log("Fetching prices from:", priceUrl);

            const priceResponse = await fetch(priceUrl, { headers: { Accept: "application/json" } });

            if (!priceResponse.ok) {
                console.error(`Price fetch failed with status: ${priceResponse.status}`);
                throw new Error(`Failed to fetch token prices: ${priceResponse.statusText}`);
            }

            const fetchedPriceData: TokenDataGecko = await priceResponse.json();
            priceData.push(...fetchedPriceData.data);
        }

        // Merge price data back into the full token list
        const tokensWithPrices = updatedTokens.map((token) => {
            const tokenAddress = token.contractAddress?.toLowerCase();
            const fetchedToken = priceData.find((t) => t.attributes.address.toLowerCase() === tokenAddress);

            if (fetchedToken) {
                const tokenPrice = parseFloat(fetchedToken.attributes.price_usd || "0");
                const tokenValue = (parseFloat(token.balance) * tokenPrice).toFixed(6);

                return {
                    ...token,
                    price: tokenPrice.toFixed(6),
                    value: tokenValue,
                };
            } else {
                return { ...token, price: "0.00", value: "0.00" };
            }
        });

        if (chain) {
            const explorer = chain.explorers && chain.explorers.length > 0 ? chain.explorers[0] : undefined;
            const chainSymbol = chain.chain;

            if (explorer) {
                console.log("Setting chain data:", { ...chain, explorer, symbol: chainSymbol });
                setChainData({
                    ...chain,
                    explorer,
                    symbol: chainSymbol,
                });
            }
        }

        // Save the complete API data
        setTokenListData(priceData);
        setMarketplaceContract(marketplace)
        setTokenBalances(tokensWithPrices);
        setRouter(router);
        setWETH9(WETH9);
    } catch (error) {
        console.error("Error updating token balances:", error);
    }
}, [tokenList, account, setTokenListData, setTokenBalances, setChainData, setRouter, setWETH9]);
  
/* ---------------------------------------------------------------
    ** ✅ Fetch Token List *
  --------------------------------------------------------------- */ 

           
  const fetchTokenList = useCallback(async () => {
    try {
      console.log("🔍 Fetching token list...");
  
      if (!chainId) {
        console.error("❌ Error: chainId is undefined or invalid.");
        return;
      }
  
      const url = `https://www.ioPlasmaVerse.com/api/getCurrenyData/${chainId}`;
      const response = await fetch(url);
      console.log("url", url)
      if (!response.ok) {
        console.error(`❌ Failed to fetch token list. HTTP Status: ${response.status}`);
        return;
      }
  
      const data = await response.json();
      if (!data || typeof data !== "object" || !("tokens" in data) || !Array.isArray(data.tokens)) {
        console.error("❌ Invalid API response structure.");
        return;
      }
  
      const tokens = data.tokens.map((token: any) => ({
        chainId: Number(token.chain_id),
        contractAddress: token.contract_address,
        name: token.name,
        symbol: token.symbol,
        decimals: token.decimals,
        image: token.logo_uri,
      }));
  
      setTokenList(tokens);
    } catch (error: any) {
      console.error("❌ Error in fetchTokenList:", error.message || error);
    }
  }, [chainId]); // ✅ Memoized with dependencies
  
  const contract = getContract({
  client,
  chain: defineChain(Number(chainId)),
  address: marketplace,
 });


  useEffect(() => {
      fetchTokenList();
    
  }, [chainId]);
  
  // Fetch balances only when tokenList is updated
  useEffect(() => {
    if (tokenList.length > 0) {
      updateBalances(chainId);
    }
  }, [tokenList, account]);
 

            
        
  return (
    <CurrencyContext.Provider value={{ feeReciever, marketplace: contract, nftCollection, tokenList, router, updateBalances, setTokenList, tokenBalances, tokenListData, WETH9, chainId , setChainId, chainData }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};
