"use client";
/**
 * **BuyListingButtonErc20 Component**
 * -----------------------------------
 * **Purpose:**
 * - Allows users to **purchase NFTs using ERC-20 tokens** from **Direct Listings** or **Auctions**.
 *
 * **Props:**
 * @param {EnglishAuction} auctionListing - Details of the auction listing (if available).
 * @param {DirectListing} directListing - Details of the direct listing (if available).
 * @param {Address} account - The connected user's wallet address.
 * @param {ThirdwebContract} marketplace - The marketplace contract.
 *
 * **Features:**
 * - ✅ Supports **buying with ERC-20 tokens**.
 * - ✅ **Checks user balance** before allowing purchase.
 * - ✅ **Handles both auctions & direct listings**.
 * - ✅ Displays **status messages & transaction confirmations**.
 */
import { TransactionButton, useReadContract } from "thirdweb/react";
import {
  
  EnglishAuction,
  buyFromListing,
  buyoutAuction,
  getListing,
} from "thirdweb/extensions/marketplace";

import { balanceOf, decimals } from "thirdweb/extensions/erc20";
import { useEffect, useState } from "react";
import { Address, ADDRESS_ZERO, defineChain, getContract, ThirdwebContract } from "thirdweb";
import { client } from "@/app/constants";
import { MARKETPLACE } from "@/hooks/contracts";


interface DirectListing {
  id: string;
  creatorAddress: Address;
  assetContractAddress: Address;
  tokenId: string;
  quantity: string;
  currencyContractAddress: Address;
  currencySymbol: string;
  pricePerToken: string;
  startTimeInSeconds: string;
  endTimeInSeconds: string;
  isReservedListing: boolean;
  status: number;
}




const toSmallestUnit = (amount: string, decimals: number): string => {
  const amountBigInt = BigInt(parseFloat(amount) * Math.pow(10, decimals));
  return amountBigInt.toString();
};

export default function BuyListingButtonErc20({
  auctionListing,
  directListing,
  account,
  marketplace
}: {
  auctionListing?: EnglishAuction;
  directListing?: DirectListing;
  account: Address;
  marketplace: ThirdwebContract;
  
}) {
   /* ---------------------------------------------------------------
     State Variables
  --------------------------------------------------------------- */ 
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [hasSufficientBalance, setHasSufficientBalance] = useState(false);
 

   /* ---------------------------------------------------------------
    🏦 **Get ERC-20 Contract Address (from auction or direct listing)**
   --------------------------------------------------------------- */
   const ERC20 = directListing?.currencyContractAddress || auctionListing?.currencyContractAddress;
    const ERC20Contract = getContract({
       address: ERC20 || ADDRESS_ZERO,
       client,
       chain: defineChain(MARKETPLACE.chain.id),
   });
    /* ---------------------------------------------------------------
        🏦 **Get User's ERC-20 Balance**
  --------------------------------------------------------------- */
  const { data: UserTokenBalance, isLoading: loadingUserWallet } = useReadContract(
    balanceOf,
    {
      contract: ERC20Contract,
      address: account ,
      queryOptions: {
        enabled: !!account,
      }
    }
  );
 /* ---------------------------------------------------------------
 🔢 **Get ERC-20 Token Decimals**
   --------------------------------------------------------------- */
   const { data: decimalsData } = useReadContract(
    decimals,
    {
      contract: ERC20Contract,
     
    }
  );
  
   /**
   * **Fetch Listing Details**
   * Retrieves **direct listing** or **auction** details from the marketplace.
   */

  async function getListingDetails(listingId: bigint) {
    try {
      const listing = await getListing({
        contract: marketplace,
        listingId: listingId,
      });
      return listing;
    } catch (error) {
      console.error("Error fetching listing details:", error);
      throw error;
    }
  }

   /**
   * **💰 Check if User Has Enough ERC-20 Balance**
   * - Converts price into smallest unit.
   * - Compares it with the user’s balance.
   */
 
  useEffect(() => {
    if (!loadingUserWallet && UserTokenBalance && directListing && decimalsData) {
      const listingPrice = BigInt(toSmallestUnit(directListing.pricePerToken, decimalsData));
      const userBalance = BigInt(UserTokenBalance.toString());

      if (userBalance >= listingPrice) {
        setHasSufficientBalance(true);
      } else {
        setHasSufficientBalance(false);
      }
    }
  }, [UserTokenBalance, loadingUserWallet, directListing, decimalsData]);
   /* ---------------------------------------------------------------
   Transaction Button Rendering
  --------------------------------------------------------------- */

  return (
    <>
    <TransactionButton
      disabled={
        loading ||
        account === auctionListing?.creatorAddress ||
        account === directListing?.creatorAddress ||
        (!directListing && !auctionListing) ||
        !hasSufficientBalance ||
        loadingUserWallet
      }
      transaction={async () => {
       
        if (!account) {
          setMessage("⚠️ Please connect your wallet first.");
          throw new Error("No account found");
        }

        if (auctionListing) {
          console.log("Auction Listing ID:", auctionListing.id);
          setLoading(true);
          setMessage("⏳ Processing purchase...");

          return buyoutAuction({
            contract: marketplace,
            auctionId: auctionListing.id,
          });
        } else if (directListing) {
          console.log("Direct Listing ID:", directListing.id);
          setLoading(true);
          setMessage("⏳ Processing purchase...");
          const listingDetails = await getListingDetails(BigInt(directListing.id));
          console.log("Listing Details:", listingDetails);
          return buyFromListing({
            contract: marketplace,
            listingId: BigInt(directListing.id),
            recipient: account,
            quantity: BigInt(1),
          });
        } else {
          throw new Error("No valid listing found for this NFT");
        }
      }}
      onTransactionSent={() => {
        console.log("Transaction sent");
        setMessage("📤 Transaction sent. Waiting for confirmation...");
      
      }}
      onError={() => {
        setMessage("❌ Purchase failed. Please try again.");
            
      }}
      onTransactionConfirmed={async (txResult) => {

        console.log("Transaction confirmed with result:", txResult);
        setLoading(false);
        setMessage(
          `✅ Successfully purchased! 🎉 <br />
          <a href="https://www.ioPlasmaVerse.com/transactionHash/4689/${txResult.transactionHash}" 
             target="_blank" 
             style="color: #61dafb; text-decoration: underline;">
          View Transaction</a>`
        );
      }}
    >
        {loading ? "Processing..." : "Buy Now"}
        </TransactionButton>
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
          dangerouslySetInnerHTML={{ __html: message }} // ✅ Allows clickable transaction links
        />
      )}
        </>
  );
}

