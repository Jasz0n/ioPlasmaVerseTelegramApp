/**
 * **ListingSection Component**
 * -----------------------------------
 * **Purpose:**
 * - Allows users to list their **NFTs for sale** on a marketplace.
 * - Handles **NFT approval** and **listing transactions**.
 *
 * **Props:**
 * @param {string} contractAddress - The NFT collection contract address.
 * @param {string} tokenId - The token ID of the NFT to be listed.
 * @param {Function} onClose - Function to close the listing modal.
 * @param {contract} marketplace - The Marketplace Contract to list.

 *
 * **Features:**
 * - ✅ **NFT approval check** before listing.
 * - ✅ Allows users to **set start & end dates** for the listing.
 * - ✅ Handles **listing transaction** on the **IoTeX marketplace**.
 */

import { useState } from "react";
import { useForm } from "react-hook-form";
import { ADDRESS_ZERO, defineChain, getContract, ThirdwebContract } from "thirdweb";
import {  isApprovedForAll, setApprovalForAll } from "thirdweb/extensions/erc721";
import { createListing } from "thirdweb/extensions/marketplace";
import { TransactionButton, useActiveAccount, useReadContract } from "thirdweb/react";
import styles from "./NftCard2.module.css";
import { Card, Text } from "@mantine/core";
import { client } from "@/app/constants";
import { renderMessage } from "./functions";


type Props = {
    tokenId?: string;
    contractAddress: string;
    onClose: () => void;
    marketplace: ThirdwebContract;
  };



const ListingSection = ({ contractAddress, marketplace, tokenId, onClose }: Props) => {
  /* ---------------------------------------------------------------
     State Variables
  --------------------------------------------------------------- */ 

  const account = useActiveAccount();
  const NETWORK = defineChain(4689)
  const [directListingState, setDirectListingState] = useState({ price: "0" });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const { register: registerDirect, watch: watchDirect } = useForm();
  const startDate = watchDirect("startDate");    
  const endDate = watchDirect("endDate");
  const NFTCollectionAddress = contractAddress as `0x${string}`;
  const address = marketplace.address as `0x${string}`;
  const validContractAddress = contractAddress;
  const Contract = getContract({ address: validContractAddress, client, chain: NETWORK });
  const { data: hasApproval } = useReadContract(isApprovedForAll, { contract: Contract, owner: account?.address || ADDRESS_ZERO, operator: address });
     /* ---------------------------------------------------------------
   JSX Rendering
--------------------------------------------------------------- */ 
  
  return (
    <div>
      <Card
        shadow="lg"
        radius="md"
        withBorder
        style={{
          backgroundColor: "rgba(255, 255, 255, 0.05)", 
          border: "1px solid rgba(97, 218, 251, 0.3)",
          color: "#f5f5f5",
          padding: "1.5rem",
          marginBottom: "1.5rem",
        }}
      >        
      <button 
        onClick={onClose} 
        style={{
          position: "absolute",
          background: "transparent",
          border: "none",
          fontSize: "1.5rem",
          cursor: "pointer",
          color: "#fff",
        }}
      >
        Go Back
      </button>
            
       
          <div>
           <Text  size="sm" style={{ fontWeight: 600,color: "#a8dadc", marginBottom: "0.5rem" }}>
                           When
                         </Text>
                         <Text size="xs" style={{ color: "#e5e5e5", marginBottom: "0.2rem" }}>
                           Listing Starts on
                         </Text>
            <input className={styles.input} type="datetime-local" {...registerDirect("startDate")} aria-label="Auction Start Date" />
            <Text size="xs" style={{ color: "#e5e5e5", marginBottom: "0.2rem" }}>
                Listing Ends on
              </Text>           
               <input className={styles.input} type="datetime-local" {...registerDirect("endDate")} aria-label="Auction End Date" />
               <Text size="xs" style={{ color: "#e5e5e5", marginBottom: "0.2rem" }}>
                Price per Token
              </Text>
             <input  type="number" step={0.000001} value={directListingState.price} onChange={(e) => setDirectListingState({ price: e.target.value })} />
          </div>
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
            >
              {renderMessage(message)}
            </div>
          )}
          {hasApproval && (
          <TransactionButton
          disabled={loading} // ✅ Disable button when processing
          transaction={async () => {
            try {
              setLoading(true);
              setMessage("⏳ Processing transaction..."); 
              return createListing({
                contract: marketplace,
                assetContractAddress: NFTCollectionAddress,
                tokenId: BigInt(tokenId || 0),
                pricePerToken: directListingState.price,
                startTimestamp: new Date(startDate),
                endTimestamp: new Date(endDate),
              });
            } catch (error) {
              setLoading(false);
              setMessage("❌ Transaction failed! Please try again."); // ✅ Display error inside component
              throw error; // Ensure error is caught by `onError`
            }
          }}
          onTransactionSent={() => {
            setMessage("⏳ Transaction sent, waiting for confirmation...");
          }}
          onError={() => {
            setLoading(false);
            setMessage("❌ Transaction failed! Please try again."); // ✅ Show failure message
          }}
          onTransactionConfirmed={async (txResult) => {
            setLoading(false);
            setMessage(`✅ Successfully listed! check out the Transaction on: https://www.ioPlasmaVerse.com/transactionHash/${4689}/${txResult.transactionHash} 🎉`); // ✅ Show success message
          }}
        >
          {loading ? "Listing for Sale..." : "List for Sale"}
        </TransactionButton>
        )}
        {!hasApproval && (
         <TransactionButton
         disabled={loading} // ✅ Disable button when processing

        transaction={() => {
          setLoading(true);
          setMessage("⏳ Processing Approval...");
          return setApprovalForAll({
            contract: Contract,
            operator: address,
            approved: true,
          });
        }}
        onTransactionSent={() => {
          setMessage("⏳ Transaction sent, waiting for Approval confirmation...");
        }}
        onError={() => {
          setLoading(false);
          setMessage("❌ Transaction failed! Please try again."); // ✅ Show failure message
        }}
        onTransactionConfirmed={async (txResult) => {
          setLoading(false);
          setMessage(`✅ Successfully Approved! You can know List the Nft 🎉 Check out the Transaction on: https://www.ioPlasmaVerse.com/transactionHash/${4689}/${txResult.transactionHash} 🎉`); // ✅ Show success message
        
        }}
      >
        Approve
      </TransactionButton>
        )}
        
            
      </Card>
    </div>
  );
};

export default ListingSection;
