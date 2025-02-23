"use client";
/**
 * **NftInformationPrice Component**
 * -----------------------------------
 * **Purpose:**
 * - Displays **NFT pricing information** for **Direct Listings** and **Auction Listings**.
 * - Supports **ERC-20 & Native Token (IOTX)** payments.
 * 
 * **Props:**
 * @param {bigint} tokenId - The unique ID of the NFT.
 * @param {string} contractAddress - The NFT contract address.
 * @param {number} chainId - The blockchain chain ID.
 * 
 * **Features:**
 * - ✅ Supports **Direct Listings & Auctions**.
 * - ✅ Fetches **ERC-20 metadata & decimals** dynamically.
 * - ✅ Displays **correct currency symbols & values**.
 * - ✅ Handles **NFTs that are not for sale**.
 */

import  { FC, useMemo } from "react";
import { Address, ADDRESS_ZERO, defineChain, getContract } from "thirdweb";
import { useMarketplaceData } from "../hooks/marketProvider";
import { useReadContract } from "thirdweb/react";
import { decimals, getCurrencyMetadata } from "thirdweb/extensions/erc20";
import { client } from "@/app/constants";
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
  minimumBidCurrencyValue: string; 
  buyoutBidAmount: string;
  buyoutCurrencyValue: string;
  timeBufferInSeconds: string;
  bidBufferBps: string;
  startTimeInSeconds: string;
  endTimeInSeconds: string;
  status: any;
};

type INFTCardProps = {
  tokenId: bigint;
  contractAddress: string;
  chainId: number;
};


export const NftInformationPrice: FC<INFTCardProps> = ({
  contractAddress,
  tokenId,
  chainId
  
}) => {
  const { validListings, validAuctions } = useMarketplaceData();

  

  /* ---------------------------------------------------------------
     🔢 ** ✅ Find matching **Direct Listing** for the NFT **
       --------------------------------------------------------------- */
  const directListing = useMemo(() => 
    validListings?.find(
      (l): l is DirectListing => l.assetContractAddress === contractAddress && BigInt(l.tokenId) === tokenId
    ), 
    [validListings, contractAddress, tokenId]
  );
  
 /* ---------------------------------------------------------------
     🔢 ** ✅ Find matching **English Auction** for the NFT **
       --------------------------------------------------------------- */
  const auctionListing = useMemo(() => 
    validAuctions?.find(
      (l): l is EnglishAuction => l.assetContractAddress === contractAddress && BigInt(l.tokenId) === tokenId
    ), 
    [validAuctions, contractAddress, tokenId]  );

     /* ---------------------------------------------------------------
          ** ✅ Get ERC-20 contract address (if applicable) **
       --------------------------------------------------------------- */

    const ERC20 = directListing?.currencyContractAddress || auctionListing?.currencyContractAddress;
        const ERC20Contract = getContract({
           address: ERC20 || ADDRESS_ZERO,
           client,
           chain: defineChain(chainId),
       });

    /* ---------------------------------------------------------------
     🔢 **Get ERC-20 Token Decimals**
       --------------------------------------------------------------- */
       const { data: decimalsData } = useReadContract(
        decimals,
        {
          contract: ERC20Contract,
         
        }
      );

      /* ---------------------------------------------------------------
 🔢 **Get ERC-20 Token contractMetadata**
   --------------------------------------------------------------- */
   const { data: tokenName } = useReadContract(
    getCurrencyMetadata,
    {
      contract: ERC20Contract,
     
    }
  );

    /* ---------------------------------------------------------------
   JSX Rendering
--------------------------------------------------------------- */ 

  return (
    <div>
      <div>
        {directListing || auctionListing ? (
          <div className="p-4 rounded-lg w-full ">
            <p className="mb-1 text-white/60">Price</p>
            <div className="text-lg font-medium rounded-md text-white/90">
              {directListing && (
                <>
                  {directListing.currencyContractAddress === "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE" ? (
                    <>
                      {directListing.pricePerToken} <span>IOTX</span>
                    </>
                  ) : directListing.currencyContractAddress ?(
                    <>
                      {directListing.pricePerToken} <span>{tokenName?.symbol}</span>
                    </>
                 ):(
                    "Currency not supported"
                  )}
                </>
              )}
              {auctionListing && (
                <>
                  {auctionListing.minimumBidCurrencyValue}
                </>
              )}
            </div>
           
          </div>
        ) : (
          <div className="p-4 rounded-lg w-full bg-white/[.04]">
            <p className="mb-1 text-white/60">Price</p>
            <div className="text-lg font-medium rounded-md text-white/90">
              Not for sale
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
