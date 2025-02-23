"use client";
import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { Address, ThirdwebContract, defineChain, getContract, readContract } from 'thirdweb';
import { BigNumber } from "ethers";

import {  totalListings, totalOffers } from "thirdweb/extensions/marketplace";
import { client } from "@/app/constants";
import { useCurrency } from "./currency";

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
  status: number;
};

export interface offer {
  offerId: string;
  tokenId: string;
  quantity: string;
  totalPrice: string;
  expirationTimestamp: string;
  offeror: string;
  assetContract: string;
  currency: string;
  tokenType: string;
  status: string; 
  pricePerToken: string;
  }


interface MarketplaceContextProps {
  validListings: DirectListing[];
  validAuctions: EnglishAuction[];
  validOffers: offer[];
  loading: boolean;
}

interface MarketplaceDataProviderProps {
  children: ReactNode;
}

interface CurrencyData {
  symbol: string;
  decimals: number;
  address: Address;
}

const CURRENCY_DATA: CurrencyData[] = [
  { symbol: 'IOTX', decimals: 18, address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE' }, // Native
  { symbol: 'ioShiba', decimals: 9, address: '0x3EA683354bf8d359cd9EC6E08B5AEC291D71d880' }, // ioShiba
  { symbol: 'dePinny', decimals: 18, address: '0xdfF8596d62b6d35fFFfc9e465d2FDeA49Ac3c311' }  // depinny
];

const MarketplaceDataContext = createContext<MarketplaceContextProps | undefined>(undefined);

export const MarketplaceProvider: React.FC<MarketplaceDataProviderProps> = ({ children }) => {
  const [validListings, setValidListings] = useState<DirectListing[]>([]);
  const [validAuctions, setValidAuctions] = useState<EnglishAuction[]>([]);

  const [validOffers, setValidOffers] = useState<offer[]>([]);
    const { tokenBalances, router, chainId, nftCollection,feeReciever,tokenList, marketplace, WETH9, setChainId} = useCurrency();
  
  const [isLoading, setIsLoading] = useState<boolean>(false);
    const MARKETPLACE_ADDRESS = "0xF87c2066577f2e1c799C4e5628d578B623F5481f";
        const MARKETPLACE = marketplace;
  
    const fetchGetAllValidListings = useCallback(async (section: ThirdwebContract) => {
  
      setIsLoading(true);
      try {
  
        const result = await totalListings({
          contract: section,
         });
         const totalCount = Number(result);
    
         if (!Number.isSafeInteger(totalCount)) {
          setValidListings([])
             throw new Error('The total count value exceeds the safe integer range.');
         }
         const totalCountAuctions = totalCount -1;
  
          const listingsData = await readContract({
              contract: section,
              method: "function getAllValidListings(uint256 _startId, uint256 _endId) view returns ((uint256 listingId, uint256 tokenId, uint256 quantity, uint256 pricePerToken, uint128 startTimestamp, uint128 endTimestamp, address listingCreator, address assetContract, address currency, uint8 tokenType, uint8 status, bool reserved)[] listings)", 
             params: [BigInt(0), BigInt(totalCountAuctions)]
          }) as unknown as any[];
  
  
          if (!Array.isArray(listingsData) || listingsData.length === 0) {
              console.error("Listings data is not an array or is empty.");
              return;
          }
  
          const listings = await Promise.all(listingsData.map(async (listing, index) => {
  
              if (!listing || typeof listing !== 'object') {
                  console.error(`Invalid listing data at index ${index}:`, listing);
                  return null;
              }
  
              try {
                  // Ensure fields are accessed correctly
                  const id = listing.listingId ? BigNumber.from(listing.listingId).toBigInt() : BigInt(0);
                  const tokenId = listing.tokenId ? BigNumber.from(listing.tokenId).toBigInt() : BigInt(0);
                  const quantity = listing.quantity ? BigNumber.from(listing.quantity).toBigInt() : BigInt(0);
                  const pricePerTokenBigNumber = listing.pricePerToken ? BigNumber.from(listing.pricePerToken) : BigNumber.from(0);
                  const startTimeInSeconds = listing.startTimestamp ? BigNumber.from(listing.startTimestamp).toBigInt() : BigInt(0);
                  const endTimeInSeconds = listing.endTimestamp ? BigNumber.from(listing.endTimestamp).toBigInt() : BigInt(0);
                  const creatorAddress = listing.listingCreator;
                  const assetContractAddress = listing.assetContract;
                  const currencyContractAddress = listing.currency.toString();
                  const status = listing.status;
                  const isReservedListing = listing.reserved !== undefined ? listing.reserved : false;
                  
                  if (!CURRENCY_DATA || CURRENCY_DATA.length === 0) {
                    console.error("CURRENCY_DATA is not loaded or empty.");
                    return;
                }                const currency = CURRENCY_DATA?.find(c => c.address?.toLowerCase().toString() === currencyContractAddress.toLowerCase());
  
                                  if (!currency) {
                                    console.error(`Currency data not found for address: ${currencyContractAddress}`);
                                    return null;
                  }
  
                  // Calculate price per token
                  const pricePerToken = pricePerTokenBigNumber.div(BigNumber.from(10).pow(currency.decimals)).toString();
                  const currencySymbol = currency.symbol;
  
                  return {
                    id: id.toString(),
                    creatorAddress,
                    assetContractAddress,
                    tokenId: tokenId.toString(),
                    quantity: quantity.toString(),
                    currencyContractAddress,
                    currencySymbol,
                    pricePerToken: pricePerToken,
                    startTimeInSeconds: startTimeInSeconds.toString(),
                    endTimeInSeconds: endTimeInSeconds.toString(),
                    isReservedListing,
                    status
                  };
              } catch (error) {
                  return null;
              }
          }));
  
          // Filter out null values
          const validListings = listings.filter(listing => listing !== null) as DirectListing[];
  
          setValidListings(validListings); 
  
      } catch (error) {
        setValidListings([]);

          console.error("Error fetching listings:", error);
      } finally {
          setIsLoading(false);
      }
  }, [CURRENCY_DATA]);
  
  
  
  
  
  const fetchGetAllValidAuctions = useCallback(async (section: ThirdwebContract) => {
    setIsLoading(true);
  
    try {
      const result = await totalListings({
        contract: section,
       });
       const totalCount = Number(result);
  
       if (!Number.isSafeInteger(totalCount)) {
          setValidAuctions([]); 

           throw new Error('The total count value exceeds the safe integer range.');
          }
       const totalCountAuctions = totalCount -1;
  
      const auctionsData = await readContract({
        contract: section,
        method: "function getAllValidAuctions(uint256 _startId, uint256 _endId) view returns ((uint256 auctionId, uint256 tokenId, uint256 quantity, uint256 minimumBidAmount, uint256 buyoutBidAmount, uint64 timeBufferInSeconds, uint64 bidBufferBps, uint64 startTimestamp, uint64 endTimestamp, address auctionCreator, address assetContract, address currency, uint8 tokenType, uint8 status)[] auctions)", 
              params: [BigInt(0), BigInt(totalCountAuctions)]
      }) as unknown as any[];
  
  
      if (!Array.isArray(auctionsData) || auctionsData.length === 0) {
        console.error("Auctions data is not an array or is empty.");
        return;
      }
  
      const auctions = await Promise.all(auctionsData.map(async (auction, index) => {
  
        if (!auction || typeof auction !== 'object') {
          console.error(`Invalid auction data at index ${index}:`, auction);
          return null;
        }
  
        try {
          const id = auction.auctionId ? BigNumber.from(auction.auctionId).toBigInt() : BigInt(0);
          const tokenId = auction.tokenId ? BigNumber.from(auction.tokenId).toBigInt() : BigInt(0);
          const quantity = auction.quantity ? BigNumber.from(auction.quantity).toBigInt() : BigInt(0);
          const minimumBidAmount = auction.minimumBidAmount ? BigNumber.from(auction.minimumBidAmount).toBigInt() : BigInt(0);
          const buyoutBidAmount = auction.buyoutBidAmount ? BigNumber.from(auction.buyoutBidAmount).toBigInt() : BigInt(0);
          const timeBufferInSeconds = auction.timeBufferInSeconds ? BigNumber.from(auction.timeBufferInSeconds).toBigInt() : BigInt(0);
          const bidBufferBps = auction.bidBufferBps ? BigNumber.from(auction.bidBufferBps).toBigInt() : BigInt(0);
          const startTimeInSeconds = auction.startTimestamp ? BigNumber.from(auction.startTimestamp).toBigInt() : BigInt(0);
          const endTimeInSeconds = auction.endTimestamp ? BigNumber.from(auction.endTimestamp).toBigInt() : BigInt(0);
          const creatorAddress = auction.auctionCreator;
          const assetContractAddress = auction.assetContract;
          const currencyContractAddress = auction.currency.toString();
          const status = auction.status;
         
          if (!CURRENCY_DATA || CURRENCY_DATA.length === 0) {
            console.error("CURRENCY_DATA is not loaded or empty.");
            return;
        }
          const currency = CURRENCY_DATA?.find(c => c.address?.toLowerCase().toString() === currencyContractAddress.toLowerCase());
          
      
            if (!currency) {
              console.error(`Currency data not found for address: ${currencyContractAddress}`);
              return null;
          }
         
      
          const minimumBidCurrencyValue = BigNumber.from(minimumBidAmount).div(BigNumber.from(10).pow(currency.decimals)).toString();
          const buyoutCurrencyValue = BigNumber.from(buyoutBidAmount).div(BigNumber.from(10).pow(currency.decimals)).toString();
  
          return {
              id: id.toString(),
              creatorAddress,
              assetContractAddress,
              tokenId: tokenId.toString(),
              quantity: quantity.toString(),
              currencyContractAddress,
              minimumBidAmount: minimumBidAmount.toString(),
              minimumBidCurrencyValue: minimumBidCurrencyValue.toString(),
              buyoutBidAmount: buyoutBidAmount.toString(),
              buyoutCurrencyValue: buyoutCurrencyValue.toString(),
              bidBufferBps: bidBufferBps.toString(),
              timeBufferInSeconds: timeBufferInSeconds.toString(),
              startTimeInSeconds: startTimeInSeconds.toString(),
              endTimeInSeconds: endTimeInSeconds.toString(),
              status
          }
        } catch (error) {
          console.error(`Error processing auction data at index ${index}:`, error);
          return null;
        }
      }));
  
      const validAuctions = auctions.filter(auction => auction !== null) as EnglishAuction[];
      setValidAuctions(validAuctions);
    } catch (error) {
      setValidAuctions([]); // Set the valid listings state

      console.error("Error fetching auctions:", error);
    } finally {
      setIsLoading(false);
    }
  }, [CURRENCY_DATA]);
  

  
   
  
  const fetchGetAlloffers = useCallback(async (section: ThirdwebContract) => {
    setIsLoading(true);
    try {
      const result = await totalOffers({
        contract: section,
       });
       const totalCount = Number(result);
  
       if (!Number.isSafeInteger(totalCount)) {
           throw new Error('The total count value exceeds the safe integer range.');
       }
       const totalCountAuctions = totalCount -1;
  
        const listingsData = await readContract({
            contract: section,
            method: "function getAllValidOffers(uint256 _startId, uint256 _endId) view returns ((uint256 offerId, uint256 tokenId, uint256 quantity, uint256 totalPrice, uint256 expirationTimestamp, address offeror, address assetContract, address currency, uint8 tokenType, uint8 status)[] _validOffers)",
            params: [BigInt(0), BigInt(totalCountAuctions)]
  
          }) as unknown as any[];
  
        if (!Array.isArray(listingsData) || listingsData.length === 0) {
            console.error("Listings data is not an array or is empty.");
            return;
        }
  
        const listings = await Promise.all(listingsData.map(async (listing, index) => {
  
            if (!listing || typeof listing !== 'object') {
                console.error(`Invalid listing data at index ${index}:`, listing);
                return null;
            }
  
            try {
                // Ensure fields are accessed correctly
                const offerId = listing.offerId ? BigInt(listing.offerId) : BigInt(0);
                const tokenId = listing.tokenId ? BigInt(listing.tokenId) : BigInt(0);
                const quantity = listing.quantity ? BigInt(listing.quantity) : BigInt(0);
                const totalPrice = listing.totalPrice ? BigNumber.from(listing.totalPrice) : BigNumber.from(0);
                const expirationTimestamp = listing.expirationTimestamp ? BigInt(listing.expirationTimestamp) : BigInt(0);
                const offeror = listing.offeror;
                const assetContract = listing.assetContract;
                const currencyAddress = listing.currency.toString().toLowerCase();
                const status = listing.status;
                const tokenType = listing.tokenType;
                
                if (!CURRENCY_DATA || CURRENCY_DATA.length === 0) {
                    console.error("CURRENCY_DATA is not loaded or empty.");
                    return;
                }
  
                const currency = CURRENCY_DATA.find(c => c.address?.toLowerCase().toString() === currencyAddress);
  
                if (!currency) {
                    console.error(`Currency data not found for address: ${currencyAddress}`);
                    return null;
                }
  
                // Calculate price per token and convert to string
                const pricePerToken = totalPrice.div(BigNumber.from(10).pow(currency.decimals)).toString();
                const currencySymbol = currency.symbol;
  
                return {
                    offerId: offerId.toString(),
                    tokenId: tokenId.toString(),
                    quantity: quantity.toString(),
                    currency: currencyAddress,
                    currencySymbol,
                    pricePerToken: `${pricePerToken}  ${currencySymbol}`, // Ensure this is a string
                    offeror,
                    assetContract,
                    tokenType,
                    totalPrice: totalPrice.toString(), // Convert totalPrice to string
                    expirationTimestamp: expirationTimestamp.toString(),
                    status
                };
            } catch (error) {
                console.error(`Error processing listing data at index ${index}:`, error);
                return null;
            }
        }));
  
        // Filter out null values and cast as offer[]
        const validListings = listings.filter(listing => listing !== null) as offer[];
        setValidOffers(validListings); // Set the valid listings state
  
    } catch (error) {
      setValidOffers([]); // Set the valid listings state

        console.error("Error fetching listings:", error);
    } finally {
        setIsLoading(false);
    }
  }, [ CURRENCY_DATA]);

  
  useEffect(() => {
    fetchGetAllValidListings(MARKETPLACE);
    fetchGetAllValidAuctions(MARKETPLACE);
    fetchGetAlloffers(MARKETPLACE);

}, [  fetchGetAllValidListings,fetchGetAllValidAuctions,fetchGetAlloffers, MARKETPLACE]);

  
  return (
    <MarketplaceDataContext.Provider value={{ validListings, validAuctions,validOffers,loading: isLoading }}>
      {children}
    </MarketplaceDataContext.Provider>
  );
};

export const useMarketplaceData = () => {
  const context = useContext(MarketplaceDataContext);
  if (!context) {
    throw new Error('useContractData must be used within a MarketplaceProvider');
  }
  return context;
};
