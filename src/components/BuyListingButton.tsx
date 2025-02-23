  "use client";
  /**
   * **BuyListingButton Component**
   * --------------------------------
   * **Purpose:**
   * - Enables users to purchase **NFTs** from **Direct Listings** or **Auctions** on a marketplace.
   *
   * **Props:**
   * @param {EnglishAuction} auctionListing - Details of the auction listing (if available).
   * @param {DirectListing} directListing - Details of the direct listing (if available).
   * @param {ThirdwebContract} marketplace - The marketplace smart contract.
   *
   * **Features:**
   * - ✅ Supports **buying auctions & direct listings**.
   * - ✅ Prevents **self-purchases** by checking `creatorAddress`.
   * - ✅ Handles **transaction state, errors & UI updates**.
   */
  import { TransactionButton, useActiveAccount } from "thirdweb/react";
  import {
      buyFromListing,
    buyoutAuction,
  } from "thirdweb/extensions/marketplace";

  import { Address, defineChain, getContract, ThirdwebContract } from "thirdweb";
  import { useState } from "react";


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
  interface EnglishAuction  {
    id: string;
    creatorAddress: Address;
    assetContractAddress: Address;
    tokenId: string;
    quantity: string;
    currencyContractAddress: Address;
    minimumBidAmount: string;
    minimumBidCurrencyValue: string; // GetBalanceResult
    buyoutBidAmount: string;
    buyoutCurrencyValue: string; // GetBalanceResult 
    timeBufferInSeconds: string;
    bidBufferBps: string;
    startTimeInSeconds: string;
    endTimeInSeconds: string;
    status: string;
  };
  export default function BuyListingButton({
    auctionListing,
    directListing,
    marketplace,
  }: {
    auctionListing?: EnglishAuction;
    directListing?: DirectListing;
    marketplace: ThirdwebContract;
  }) {
    /* ---------------------------------------------------------------
      State Variables
    --------------------------------------------------------------- */ 
    const account = useActiveAccount();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    /* ---------------------------------------------------------------
    Transaction Button Rendering
    --------------------------------------------------------------- */
    return (
      <>
        <TransactionButton
          disabled={
            loading ||
            account?.address === auctionListing?.creatorAddress ||
            account?.address === directListing?.creatorAddress ||
            (!directListing && !auctionListing)
          }
          transaction={async () => {
            if (!account) {
              setMessage("⚠️ Please connect your wallet first.");
              throw new Error("No account found");
            }

            setLoading(true);
            setMessage("⏳ Processing purchase...");

            try {
              let tx;
              if (auctionListing) {
                console.log("Auction Listing ID:", auctionListing.id);
                tx = await buyoutAuction({
                  contract: marketplace,
                  auctionId: BigInt(auctionListing.id),
                });
              } else if (directListing) {
                console.log("Direct Listing ID:", directListing.id);
                tx = await buyFromListing({
                  contract: marketplace,
                  listingId: BigInt(directListing.id),
                  recipient: account.address,
                  quantity: BigInt(1),
                });
              } else {
                throw new Error("No valid listing found for this NFT");
              }

              return tx;
            } catch (error) {
              setLoading(false);
              setMessage("❌ Purchase failed. Please try again.");
              console.error("Transaction failed:", error);
              throw error;
            }
          }}
          onTransactionSent={() => {
            setMessage("📤 Transaction sent. Waiting for confirmation...");
          }}
          onError={(error) => {
            setLoading(false);
            setMessage("❌ Transaction failed. Please try again.");
            console.error("Transaction error:", error);
          }}
          onTransactionConfirmed={async (txResult) => {
            setLoading(false);
            setMessage(
              `✅ Successfully purchased! 🎉 <br />
              <a href="https://www.ioPlasmaVerse.com/transactionHash/4689/${txResult.transactionHash}" 
                target="_blank" 
                style="color: #61dafb; text-decoration: underline;">
              View Transaction</a>`
            );
            console.log("Transaction confirmed:", txResult);
          }}
        >
          {loading ? "Processing..." : "Buy with Iotex Now"}
        </TransactionButton>

        {/* ✅ Display Message Inside Component */}
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
      </>
    );
  }
