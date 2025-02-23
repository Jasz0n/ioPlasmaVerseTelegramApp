"use client";
/**
 * **NftClaim Component**
 * -----------------------------------
 * **Purpose:**
 * - Enables users to **claim NFTs** from an ERC-721 contract.
 * - Supports **minting free or paid NFTs** based on active claim conditions from the NFT collection.
 *
 * **Props:**
 * @param {number} chainId - The blockchain chain ID.
 * @param {string} contractAddress - The NFT collection contract address.
 *
 * **Features:**
 * - ✅ Displays **NFT supply information**.
 * - ✅ Allows users to **increase/decrease claim quantity**.
 * - ✅ Handles **minting logic & transactions**.
 * - ✅ Supports **Native & ERC20  payments** for priced claims.
 */
import  {  useCallback, useEffect, useMemo, useState } from 'react';
import {  Button, Group, Text, Stack, Title, Card, Divider } from '@mantine/core';
import {  MediaRenderer, TransactionButton, useActiveAccount, useReadContract } from 'thirdweb/react';
import { getContractMetadata } from "thirdweb/extensions/common";
import { ADDRESS_ZERO, defineChain, getContract, ThirdwebContract, toEther } from 'thirdweb';
import { client } from "@/app/constants";
import { claimTo, getActiveClaimCondition, getTotalClaimedSupply, nextTokenIdToMint, ownerOf, tokenURI } from 'thirdweb/extensions/erc721';
import { NFT_COLLECTION } from '@/hooks/contracts';
import ApprovalButtonERC20 from './ApprovalERC20Button';
import { allowance, decimals } from 'thirdweb/extensions/erc20';


  type Props = {
    chainId: number;
    contractAddress: string;   
  };
export const NftClaim = ({ contractAddress, chainId }: Props) => {
   /* ---------------------------------------------------------------
     State Variables
  --------------------------------------------------------------- */ 
    const account = useActiveAccount();
    const [quantity, setQuantity] = useState(1);
    const [isTokenApproved, setIsTokenApproved] = useState(false);
    const [buyingStep, setBuyingStep] = useState<string>("confirm");

     /* ---------------------------------------------------------------
   ** ✅ Determine the NFT contract address and Load the Contract**
--------------------------------------------------------------- */ 
    const NftCollection = contractAddress == ADDRESS_ZERO ? NFT_COLLECTION.address :contractAddress;
    const contract = getContract({
      address: NftCollection,
      client,
      chain: defineChain(Number(chainId) || 4689),
  });
 /* ---------------------------------------------------------------
   ** ✅ Fetch Contract Metadata **
--------------------------------------------------------------- */ 
    const { data: contractMetadata, isLoading: isContractMetadataLoading } = useReadContract(getContractMetadata, {
      contract: contract
    });
   /* ---------------------------------------------------------------
   ** ✅ Fetch Total Claim Supply Information *
--------------------------------------------------------------- */ 
    const { data: claimedSupply, isLoading: isClaimedSupplyLoading } = useReadContract(getTotalClaimedSupply, {
      contract: contract
    });
   /* ---------------------------------------------------------------
   ** ✅ Fetch the Next tokenId to Mint **
--------------------------------------------------------------- */ 
    const { data: totalNFTSupply, isLoading: isTotalSupplyLoading } = useReadContract(nextTokenIdToMint, {
      contract: contract
    });
   /* ---------------------------------------------------------------
    ** ✅ Fetch Active Claim Condition (Price, Limits, etc.) *
--------------------------------------------------------------- */ 
    const { data: claimCondition } = useReadContract(getActiveClaimCondition, {
      contract: contract
    });
    
   /* ---------------------------------------------------------------
   ** ✅ Calculate Total Price (if applicable) **
--------------------------------------------------------------- */     

    const getPrice = (quantity: number) => {
      const total = quantity * parseInt(claimCondition?.pricePerToken.toString() || "0");
      return toEther(BigInt(total));
    }
   /* ---------------------------------------------------------------
   ** ✅ Erc20 Settings and Approval **
--------------------------------------------------------------- */     
 
    const ERC20Currency = claimCondition?.currency || ADDRESS_ZERO;

    const ERC20 = getContract({
        address: ERC20Currency,
        client,
        chain: defineChain(Number(chainId) || 4689),
    });    

     const { data: ERC20Approvel } = useReadContract(allowance, {
          contract: ERC20,
          owner: account?.address || ADDRESS_ZERO,
          spender: NftCollection,
        });
       
          
       
      
        useEffect(() => {
          const checkApproval = async () => {
            try {
              if (ERC20Approvel && account && claimCondition) {
                const decimalsData = await decimals({ contract: ERC20 });
        
                setIsTokenApproved(BigInt(ERC20Approvel) >= decimalsData);
                setBuyingStep("confirm")
              }
            } catch (error) {
              console.error("Error fetching ERC20 approval:", error);
            }
          };
        
          checkApproval();
        }, [ERC20Approvel, account, claimCondition, ERC20]);
      
    
    
   /* ---------------------------------------------------------------
   JSX Rendering
--------------------------------------------------------------- */ 
  
      return (
        <div
        >
        <Card
        shadow="xl"
        radius="xl"
        style={{
            backgroundColor: "rgba(255, 255, 255, 0.05)",
            border: "1px solid #61dafb",
            color: "white",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
            width: "100%",
            textAlign: "center",
            padding: "1rem",
        }}
        >
        <Stack align="center" style={{sacing:"md"}}>
            <Title order={3} style={{ color: "cyan", fontSize: "1.2rem" }}>
            </Title>
            {isContractMetadataLoading ? (
                    <p className="text-lg text-gray-400">Loading...</p>
                ) : (
                    <>
                    <MediaRenderer
                        client={client}
                        src="ipfs://QmdccASYb46uoYKpjyFrTTNY9KBbkJUfx6t2wjMJ6JcqRd/H1.mp4"
                        className="rounded-xl shadow-lg mb-4"
                    />
                    <h2 className="text-2xl font-semibold mt-4 text-white">
                        {contractMetadata?.name}
                    </h2>
                    <p className="text-lg mt-2 text-gray-300">
                        {contractMetadata?.description}
                    </p>
                    </>
                )}
                {isClaimedSupplyLoading || isTotalSupplyLoading ? (
                    <p className="text-lg text-gray-400 mt-4">Loading...</p>
                ) : (
                    <p className="text-lg mt-2 font-bold text-white">
                    Total NFT Supply: {claimedSupply?.toString()}/{totalNFTSupply?.toString()}
                    </p>
                )}
            <div>    
            <button
                    className="bg-gray-800 text-white px-4 py-2 rounded-md mr-4 hover:bg-gray-700 transition duration-300"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    >-</button>
                    <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value))}
                    className="w-12 text-center border border-gray-500 rounded-md bg-gray-900 text-white focus:outline-none"
                    />
                    <button
                    className="bg-gray-800 text-white px-4 py-2 rounded-md ml-4 hover:bg-gray-700 transition duration-300"
                    onClick={() => setQuantity(quantity + 1)}
                    >+</button>
                </div>
            {!isTokenApproved &&
                      claimCondition?.currency.toLowerCase() !== "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE".toLowerCase() && (
                <ApprovalButtonERC20
                                        currencyContractAddress={ERC20Currency}
                                        amount={claimCondition?.pricePerToken.toString() || "0"}
                                        onApproved={() => setIsTokenApproved(true)}
                                      />
                      )}
                { account && buyingStep === "confirm" &&(
                    <TransactionButton
                    transaction={() => claimTo({
                    contract: contract,
                    to: account.address,
                    quantity: BigInt(quantity),
                    })}
                    onTransactionConfirmed={async () => {
                    alert("NFT Claimed!");
                    setQuantity(1);
                    }}
                >
                    {`Claim NFT (${getPrice(quantity)} IoTeX)`}
                </TransactionButton>                
                    )}
                    
                
        </Stack>
        </Card>
      <Divider my="sm" style={{ borderColor: "#61dafb", paddingBottom: "50px" }} />
                
        </div>
      );          
  };