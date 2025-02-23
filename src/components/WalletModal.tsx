"use client";
/**
 * **WalletDetails Component**
 * -----------------------------------
 * **Purpose:**
 * - Displays **wallet details** including **native balance**, **ERC-20 tokens**, and **owned NFTs**.
 * - Allows users to **send native tokens** and **list NFTs**.
 *
 * **Props:**
 * @param {number} chainId - The blockchain network ID.
 * @param {Token[]} tokens - List of available tokens.
 * @param {string} WETH9 - Wrapped Ethereum contract address.
 * @param {ThirdwebContract} marketplace - Marketplace contract instance.
 *
 * **Features:**
 * - ✅ Displays **native and ERC-20 balances**.
 * - ✅ Shows **owned NFTs** with navigation.
 * - ✅ Allows **sending native tokens**.
 * - ✅ Enables **listing NFTs**.
 */
import  { FC, useCallback, useEffect, useMemo, useState } from 'react';
import {  Button, Group, Text, Loader, Stack, Box, Divider, Select } from '@mantine/core';
import { handleReadBallaceNative } from './functions';
import {  useActiveAccount } from 'thirdweb/react';
import { BalanceCard } from './ballanceCard';
import { BalanceCardNative } from './ballanceCardNative';
import {  NATIVE_TOKEN_ADDRESS, ThirdwebContract } from 'thirdweb';
import { useNfts } from '../hooks/NFTOwned';
import { NFTCard } from './NFTCard';
import ListingSection from './NFTSection';
import { SendNative } from './sendNative';
import { UNISWAP_CONTRACTS } from './types';


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

interface Chain {
  Balance: string;
  Name: string;
}

interface WalletDetailsModalProps {
  chainId: number;
  tokens: Token[];
  WETH9: string;
  marketplace: ThirdwebContract;
  setChainId: React.Dispatch<React.SetStateAction<number>>;
}

export const WalletDetails: FC<WalletDetailsModalProps> = ({
  chainId,
  tokens,
  WETH9,
  marketplace,
  setChainId

}) => {
  /* ---------------------------------------------------------------
     State Variables
  --------------------------------------------------------------- */ 
  const [nativeBalances, setNativeBalances] = useState<Chain>();
  const [WETH, setWETH] = useState<Token>();
  const [activeTab, setActiveTab] = useState<'tokens' | 'nft'>('tokens'); 
  const account = useActiveAccount();
  const { ownedNfts2 } = useNfts();
  const [idNumber, setIdNumber] = useState(0);
  const [cardDetailsOpen, setCardDetailsOpen] = useState(false);
  const [ballanceSendModal, setBallanceSend] = useState(false);
 /* ---------------------------------------------------------------
   ** ✅ Format NFT List **
--------------------------------------------------------------- */ 
  
  const nftList = useMemo(() => {
    if (!ownedNfts2 || Object.keys(ownedNfts2).length === 0) return []; 
    return Object.entries(ownedNfts2).flatMap(([contractAddress, tokenIds]) =>
      tokenIds.map((tokenId) => ({ contractAddress, tokenId }))
    );
  }, [ownedNfts2]);
  /* ---------------------------------------------------------------
   ** ✅ Ensure idNumber is within range **
--------------------------------------------------------------- */ 
  
  
  const validIdNumber = useMemo(() => Math.min(idNumber, Math.max(0, nftList.length - 1)), [idNumber, nftList.length]);

  /* ---------------------------------------------------------------
    ** ✅ Get current NFT safely **
--------------------------------------------------------------- */ 
  
  const currentNFT = nftList[validIdNumber] || null;
  /* ---------------------------------------------------------------
    *** ✅ Navigation Functions **
--------------------------------------------------------------- */
  const inc = useCallback(() => {
    if (validIdNumber + 1 < nftList.length) {
      setIdNumber((prev) => prev + 1);
    }
  }, [validIdNumber, nftList.length]);
  
  const dec = useCallback(() => {
    if (validIdNumber > 0) {
      setIdNumber((prev) => prev - 1);
    }
  }, [validIdNumber]);
        
  const handleNFTClick = () => {
    setCardDetailsOpen(true);
  };

  const handleBallanceCard = () => {
    setBallanceSend(true);
  };
   /* ---------------------------------------------------------------
    ** ✅ Fetch WETH Data **
--------------------------------------------------------------- */
  
const findToken = (address: string): Token | undefined => {
  return tokens.find(
    (token) => token.contractAddress.toString().toLowerCase() === address.toString().toLowerCase()
  );
};

  
  useEffect(() => {
    const findWethBalance = async () => {
      const nativeData = await findToken(WETH9);
      setWETH(nativeData);
    };
  
    findWethBalance();
  }, [WETH9, account, findToken]);


  useEffect(() => {
    const fetchNativeBalances = async () => {
      const nativeData = await handleReadBallaceNative(
        account?.address || '',
        Number(chainId)
      );
      setNativeBalances(nativeData);
    };

    fetchNativeBalances();
  }, [chainId, account]);

 /* ---------------------------------------------------------------
   ** ✅ Filtered ERC-20 Tokens **
--------------------------------------------------------------- */ 
 
  const filteredTokenList2 = tokens.filter((token) => Number(token.balance) > 0 && token.contractAddress != NATIVE_TOKEN_ADDRESS);
 /* ---------------------------------------------------------------
   JSX Rendering
--------------------------------------------------------------- */ 

  return (
    <Box
      style={{
        flexDirection: "column",
        alignItems: "center",
        width: "100%",
        height: "100vh",
        overflow: "hidden",
      }}
    >
      {/* Fixed Header (Tabs & Native Balance) */}
      <Box
        style={{
          position: "fixed",
          top: 0,
          width: "100%",
          zIndex: 10, 
        }}
      >
        
        <Group justify="center" mt="lg">
          {["tokens", "nft"].map((tab) => (
            <Button
              key={tab}
              variant={activeTab === tab ? "filled" : "outline"}
              color="cyan"
              onClick={() => setActiveTab(tab as "tokens" | "nft")}
              style={{
                borderRadius: "20px",
                border: activeTab === tab ? "none" : "1px solid #61dafb",
                color: activeTab === tab ? "black" : "#61dafb",
                backgroundColor: activeTab === tab ? "#61dafb" : "transparent",
                transition: "all 0.3s ease",
              }}
            >
              {tab.toUpperCase()}
            </Button>
          ))}
        </Group>
  
        <Box
          style={{
            width: "100%",
            margin: "0", 
          }}
        >
          {nativeBalances && ballanceSendModal === false && WETH ? (
            <BalanceCardNative
              title={`Chain: Iotex`}
              setBalanceModalOpen={handleBallanceCard}
              balance={nativeBalances?.Balance || "0"}
              name={nativeBalances?.Name || "N/A"}
              chainId={Number(chainId)}
              native={tokens[0]}
              WETH={tokens[2]}
              
            />
          ) : (
            <Loader size="sm" variant="dots" />
          )}
        </Box>
        <Box
          style={{
            width: "100%", 
            height:"100%",
            paddingBottom: "70px"

          }}
        >
          {nativeBalances && ballanceSendModal === true && WETH ? (
            <SendNative
              title={`Chain: Iotex`}
              setBalanceModalOpen={handleBallanceCard}
              balance={nativeBalances?.Balance || "0"}
              name={nativeBalances?.Name || "N/A"}
              chainId={Number(chainId)}
              WETH={tokens[0]}
              
            />
          ) : (
            <Loader size="sm" variant="dots" />
          )}
        </Box>
</Box>
  
      {/* Scrollable Content Below (Fix Overlapping Issue) */}
      <Box
        style={{
          marginTop: "170px",
          overflowY: "auto",
          maxHeight: "calc(100vh - 250px)", 
          width: "100%",
          paddingBottom: "80px", 

        }}
      >
        {activeTab === "tokens" && ballanceSendModal === false && (
          <>
            <Text size="lg" style={{ fontWeight: 600, color: "#f5f5f5" }} mb="xs">
              ERC20 Balances
            </Text>
  
            <Stack>
              {filteredTokenList2.length > 0 ? (
                filteredTokenList2.map((token) => (
                  <BalanceCard key={token.contractAddress} token={token} />
                ))
              ) : (
                <Text style={{ textAlign: "center" }} color="dimmed">
                  No ERC20 tokens found.
                </Text>
              )}
            </Stack>
          </>
        )}
  
        {activeTab === "nft" && ballanceSendModal === false && (
          <Box>
            {nftList.length === 0 ? (
              <Text size="lg" style={{ textAlign: "center", color: "#888" }}>
              You don&apos;t own any NFTs yet.
            </Text>
            ) : (
              <>
                {cardDetailsOpen === false && currentNFT && (
                  <div onClick={() => handleNFTClick()}>
                    <NFTCard
                      tokenId={BigInt(currentNFT.tokenId)}
                      contractAddresse={currentNFT.contractAddress}
                      chainId={4689}
                    />
                  </div>
                )}
                {cardDetailsOpen && currentNFT && (
                  <ListingSection
                    tokenId={currentNFT.tokenId.toString()}
                    contractAddress={currentNFT.contractAddress}
                    onClose={() => setCardDetailsOpen(false)}
                    marketplace={marketplace}
                  />
                )}
  
                {/* Pagination Buttons */}
                <div style={{ display: "flex", justifyContent: "center", marginTop: "10px" }}>
                  <button onClick={dec} disabled={validIdNumber === 0}>⬅️ Previous</button>
                  <span style={{ margin: "0 10px" }}>{validIdNumber + 1} / {nftList.length}</span>
                  <button onClick={inc} disabled={validIdNumber + 1 >= nftList.length}>Next ➡️</button>
                </div>
              </>
            )}

          </Box>
        )}
      </Box>
      <Divider my="sm" style={{ borderColor: "#61dafb", paddingBottom: "70px" }} />

    </Box>
  );
}