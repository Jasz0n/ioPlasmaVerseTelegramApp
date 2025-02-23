"use client";

/**
 * **Nft Component**
 * -----------------------------------
 * **Purpose:**
 * - Manages **NFT marketplace interactions** and **NFT claims**.
 * - Allows users to **toggle between** NFT trading & minting.
 *
 * **Props:**
 * @param {number} chainId - The blockchain chain ID.
 * @param {string} contractAddress - The NFT collection contract address.
 * @param {ThirdwebContract} marketplace - The marketplace smart contract.
 *
 * **Features:**
 * - ✅ Enables **NFT buying & selling**.
 * - ✅ Supports **NFT minting** (claiming new tokens).
 */

import {  Button, Group, Text, Stack, Title, Card, Divider } from '@mantine/core';
import {ThirdwebContract } from 'thirdweb';
import { NftClaim } from './NftClaim';
import { NftMarket } from './NftMarket';
import { useState } from 'react';



type ContractMetadata = {
    name: string;
    description: string;
    image: string;
    animation_url: string;           

  };

  type Props = {
    chainId: number;
    contractAddress: string;   
    marketplace: ThirdwebContract
  };
export const Nft = ({ contractAddress, chainId, marketplace }: Props) => {
     /* ---------------------------------------------------------------
     State Variables
  --------------------------------------------------------------- */ 

    const [activeTab, setActiveTab] = useState<'NftMarket' | 'nft'>('NftMarket'); 
    
 /* ---------------------------------------------------------------
   JSX Rendering
--------------------------------------------------------------- */ 
  
  
      return (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            maxWidth: "97%",
            minHeight: "85vh", 
            margin: "auto",
          }}
        >
           <Group justify="center" mt="lg">
          {["NftMarket", "nft"].map((tab) => (
            <Button
              key={tab}
              variant={activeTab === tab ? "filled" : "outline"}
              color="cyan"
              onClick={() => setActiveTab(tab as "NftMarket" | "nft")}  
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
        {activeTab === "nft" &&  (

        <NftClaim contractAddress={contractAddress} chainId={chainId} />
        )}
            
        
  



        {activeTab === "NftMarket" &&  (

          <NftMarket contractAddress={contractAddress} chainId={chainId} marketplace={marketplace} />
        )}
            <Divider my="sm" style={{ borderColor: "#61dafb", paddingBottom: "50px" }} />
          

        </div>
      );          
  };