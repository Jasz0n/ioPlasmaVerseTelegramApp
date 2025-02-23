"use client";

/**
 * **NftMarket Component**
 * -----------------------------------
 * **Purpose:**
 * - Displays NFT listings from a marketplace.
 * - Allows users to browse, check metadata, and buy NFTs.
 *
 * **Props:**
 * @param {number} chainId - The blockchain chain ID.
 * @param {string} contractAddress - The NFT collection contract address.
 * @param {ThirdwebContract} marketplace - The marketplace contract.
 *
 * **Features:**
 * - ✅ Fetches and displays **NFT metadata**.
 * - ✅ Supports **buying with native & ERC-20 tokens**.
 * - ✅ Implements **pagination for listings**.
 * - ✅ Shows **owner details & ranking**.
 */

import  {  useCallback, useEffect, useMemo, useState } from 'react';
import {  Button, Group, Text, Stack, Title, Card, Divider } from '@mantine/core';
import {  MediaRenderer, TransactionButton, useActiveAccount, useReadContract } from 'thirdweb/react';
import { ADDRESS_ZERO, defineChain, getContract, ThirdwebContract, toEther } from 'thirdweb';
import { client } from "@/app/constants";
import { MdTimer } from 'react-icons/md';
import BuyListingButton from './BuyListingButton';
import BuyListingButtonErc20 from './BuyListingButtonErc20';
import ApprovalButtonERC20 from './ApprovalERC20Button';
import axios from 'axios';
import { allowance, decimals } from 'thirdweb/extensions/erc20';
import { useMarketplaceData } from '../hooks/marketProvider';
import { PUNKSRanking, SpunksRankingNew } from './contractAbi';
import { ownerOf, tokenURI } from 'thirdweb/extensions/erc721';

 /* ---------------------------------------------------------------
   Helper function to get Ranking
--------------------------------------------------------------- */ 
  
const getRanking = (id: string) => {
    const rankingData = SpunksRankingNew.find((item) => item.spunk === id);
    return rankingData ? rankingData.ranking : null;
  };
  
  const getPunkRank = (id: string) => {
    const punkData = PUNKSRanking[id as keyof typeof PUNKSRanking];
    return punkData && typeof punkData === 'object' && 'score' in punkData ? punkData.score : null;
  };




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
export const NftMarket = ({ contractAddress, chainId, marketplace }: Props) => {
    /* ---------------------------------------------------------------
     State Variables
  --------------------------------------------------------------- */ 

    const [idNumber, setIdNumber] = useState(0);
    const [ownerAddress, setOwnerAddress] = useState<string | null>(null);
    const account = useActiveAccount();
    const [ranking, setRanking] = useState<number | null>(null);
    const [tokenUriImage, setTokenURI] = useState<string>("");
    const [isTokenApproved, setIsTokenApproved] = useState(false);
    const { validListings } = useMarketplaceData();
    const [currentNFT, setCurrentNFT] = useState<ContractMetadata>({
      name: "",
      description: "",
      image: "",
      animation_url:"",
    });
      /* ---------------------------------------------------------------
    ** ✅ Fetch Marketplace Listings **
  --------------------------------------------------------------- */ 

    const filteredListings = useMemo(() => {
      if (contractAddress && contractAddress !== ADDRESS_ZERO) {
        return validListings.filter(listing => 
          listing.assetContractAddress.toLowerCase() === contractAddress.toLowerCase()
        );
      }
      return validListings; 
    }, [validListings]);
    
    
    const listing = useMemo(() => filteredListings[idNumber] || {}, [filteredListings, idNumber]);
   /* ---------------------------------------------------------------
   ** ✅ Pagination Functions **
--------------------------------------------------------------- */ 
    
    const inc = useCallback(() => {
      setIdNumber((prev) => Math.min(prev + 1, filteredListings.length - 1));
    }, [filteredListings.length]);
    
    const dec = useCallback(() => {
      setIdNumber((prev) => Math.max(prev - 1, 0));
    }, []);
   
    /* ---------------------------------------------------------------
   ** ✅ Fetch ERC-20 Approval **
--------------------------------------------------------------- */ 
    
    const ERC20 = listing.currencyContractAddress || ADDRESS_ZERO;
        
    const ERC20Contract = getContract({
           address: ERC20,
           client,
           chain: defineChain(Number(chainId) || 4689),
       });
       
    const { data: ERC20Approvel } = useReadContract(allowance, {
      contract: ERC20Contract,
      owner: account?.address || ADDRESS_ZERO,
      spender: marketplace.address,
    });
   
      
    const sliceAddress = (address: string) => {
      return `${address.slice(0, 6)}...${address.slice(-4)}`; // ✅ Shortens address
    };
   /* ---------------------------------------------------------------
   JSX Rendering
--------------------------------------------------------------- */ 
  
    useEffect(() => {
      const checkApproval = async () => {
        try {
          if (ERC20Approvel && account && listing) {
            const decimalsData = await decimals({ contract: ERC20Contract });
    
            setIsTokenApproved(BigInt(ERC20Approvel) >= decimalsData);
          }
        } catch (error) {
          console.error("Error fetching ERC20 approval:", error);
        }
      };
    
      checkApproval();
    }, [ERC20Approvel, account, listing, ERC20Contract]);
  
    /* ---------------------------------------------------------------
   ** ✅ Fetch NFT Metadata **
--------------------------------------------------------------- */ 
  
  
    
    useEffect(() => {
      if (listing) {
        
       
  
        const handleReadNft = async () => {
          try {

            const contract: ThirdwebContract = getContract({
              address: listing.assetContractAddress.toLowerCase(),
              client,
              chain: defineChain(Number(chainId) || 4689),
            });
      
            const tokenId = BigInt(listing.tokenId);
            const owner = await ownerOf({ contract, tokenId: BigInt(tokenId) });
            const tokenUri = await tokenURI({ contract, tokenId: BigInt(tokenId) });
  
            let metadataUrl: string;
  
            if (typeof tokenUri === 'string') {
              if (tokenUri.startsWith("ipfs://")) {
                const gatewayUrl = tokenUri.replace("ipfs://", "https://ipfs.io/ipfs/");
                metadataUrl = `https://nieuwe-map-5.vercel.app/metadata?url=${encodeURIComponent(gatewayUrl)}`;
              } else if (tokenUri.startsWith("data:")) {
                const base64Data = tokenUri.split(",")[1];
                const decodedData = Buffer.from(base64Data, 'base64').toString('utf-8');
                const metadata = JSON.parse(decodedData);
  
                const NftMetadata = {
                  id: metadata.id || tokenId,
                  name: metadata.name || "Unknown Name",
                  description: metadata.description || "No Description",
                  image: metadata.image || "No Image URL",
                  animation_url: metadata.animation_url || "",

                };
  
                setCurrentNFT(NftMetadata);
                setOwnerAddress(owner);
                setTokenURI(tokenUri);
                return;
              } else {
                metadataUrl = `https://nieuwe-map-5.vercel.app/metadata?url=${encodeURIComponent(tokenUri)}`;
              }
  
              const response = await axios.get(metadataUrl);
  
              if (response.data) {
                const NftMetadata = {
                  id: response.data.id || tokenId,
                  name: response.data.name || "Unknown Name",
                  description: response.data.description || "No Description",
                  image: response.data.image || "No Image URL",
                  animation_url: response.data.animation_url || "",

                };
  
                setCurrentNFT(NftMetadata);
                setOwnerAddress(owner);
                setTokenURI(tokenUri);
                setRanking(null);

                let rank: number | null = null;
  
                if (contractAddress === "0xc52121470851d0cba233c963fcbb23f753eb8709") {
                  rank = getRanking(tokenId.toString());
                } else if (contractAddress === "0xce300b00aa9c066786d609fc96529dbedaa30b76") {
                  rank = getPunkRank(tokenId.toString());
                }
    
                if (rank !== null) {
                  setRanking(rank);
                } else {
                  console.warn(`❌ No ranking found for tokenId ${tokenId}`);
                  setRanking(null);
                }
              } else {
                console.error("❌ Invalid metadata response:", response.data);
              }
            } else {
              console.error("❌ Invalid token URI format:", tokenUri);
            }
          } catch (error) {
            console.error("❌ Error fetching metadata:", error);
          }
        };
    
        handleReadNft();
      }
    }, [idNumber, validListings, ERC20Contract]);
   /* ---------------------------------------------------------------
   Formating time
--------------------------------------------------------------- */ 
  
    const formatRemainingTime = (timestamp: bigint) => {
      const remainingTimeInSeconds = Number(timestamp) - Math.floor(Date.now() / 1000);
      if (remainingTimeInSeconds <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  
      const days = Math.floor(remainingTimeInSeconds / (24 * 60 * 60));
      const hours = Math.floor((remainingTimeInSeconds % (24 * 60 * 60)) / (60 * 60));
      const minutes = Math.floor((remainingTimeInSeconds % (60 * 60)) / 60);
      const seconds = remainingTimeInSeconds % 60;
  
      return { days, hours, minutes, seconds };
    };

    const remainingTime = listing.endTimeInSeconds
      ? formatRemainingTime(BigInt(listing.endTimeInSeconds))
      : { days: 0, hours: 0, minutes: 0, seconds: 0 };
     /* ---------------------------------------------------------------
   JSX Rendering
--------------------------------------------------------------- */ 
  
      return (
        <div>
      {filteredListings.length > 0 ? (
          <><Card
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
              <Stack align="center" style={{ sacing: "md" }}>
                <Title order={3} style={{ color: "cyan", fontSize: "1.2rem" }}>
                  {currentNFT?.name || "Unknown NFT"}
                  {ranking != null ? <Text>Rank: {ranking}</Text> : null}
                </Title>

                {/* ✅ Centered Media Renderer */}
                <div style={{ display: "flex", justifyContent: "center", width: "100%" }}>
                  {currentNFT && (
                    <MediaRenderer
                      client={client}
                      src={currentNFT.animation_url || currentNFT?.image || tokenUriImage || ""}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        borderRadius: "12px",
                        boxShadow: "0 4px 8px rgba(0, 0, 0, 0.5)",
                      }} />
                  )}
                </div>

                <Divider my="sm" />

                {/* NFT Price */}
                <Group justify="space-between" style={{ width: "100%" }}>
                  <Text size="lg" style={{ fontWeight: 600, color: "#f5f5f5" }}>
                    Price:
                  </Text>
                  <Text size="md" style={{ color: "#61dafb" }}>
                    {listing
                      ? `${listing.pricePerToken} ${listing.currencyContractAddress === "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"
                        ? "IOTX"
                        : listing.currencyContractAddress === "0x3EA683354bf8d359cd9EC6E08B5AEC291D71d880"
                          ? "ioShiba"
                          : listing.currencyContractAddress === "0xdfF8596d62b6d35fFFfc9e465d2FDeA49Ac3c311"
                            ? "Depinny"
                            : "N/A"}`
                      : "N/A"}
                  </Text>
                </Group>

                {/* Token ID */}
                <Group justify="space-between" style={{ width: "100%" }}>
                  <Text size="lg" style={{ fontWeight: 600, color: "#f5f5f5" }}>
                    TokenId :
                  </Text>
                  <Text size="md" style={{ color: "#61dafb" }}>
                    {listing.tokenId}
                  </Text>
                </Group>

                {/* Owner Address */}
                {ownerAddress && (
                  <a
                    href={`https://www.ioPlasmaVerse.com/profile/${ownerAddress}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: "#61dafb",
                      textDecoration: "underline",
                      cursor: "pointer",
                    }}
                  >
                    {sliceAddress(ownerAddress)}
                  </a>
                )}

                {/* Countdown Timer */}
                <Group justify="space-between" style={{ width: "100%" }}>
                  <Text size="lg" style={{ fontWeight: 600, color: "#f5f5f5" }}>
                    End Time:
                  </Text>
                  <Group>
                    <MdTimer size="1.5rem" color="#61dafb" />
                    <Text style={{ color: "#f5f5f5" }}>
                      {remainingTime.days}d {remainingTime.hours}h {remainingTime.minutes}m{" "}
                      {remainingTime.seconds}s
                    </Text>
                  </Group>
                </Group>

                {/* ✅ NEW: Check All Details Button */}
                <a
                  href={`https://www.ioplasmaverse.com/NftGalerie/${chainId}/${listing.assetContractAddress}#${listing.tokenId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    textDecoration: "none",
                    width: "100%",
                  }}
                >
                  <Button
                    fullWidth
                    variant="light"
                    style={{
                      backgroundColor: "#61dafb",
                      color: "#121212",
                      fontWeight: 600,
                      padding: "0.5rem 1.5rem",
                      marginTop: "10px",
                    }}
                  >
                    🔍 Check All Details
                  </Button>
                </a>

                {/* Navigation & Purchase Buttons */}
                <Group justify="center" mt="lg">
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={dec}
                    disabled={idNumber === 0}
                    style={{
                      color: "#61dafb",
                      border: "1px solid #61dafb",
                      padding: "0.5rem 1.5rem",
                    }}
                  >
                    Previous
                  </Button>

                  {listing && (
                    <>
                      {listing.currencyContractAddress === "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE" ? (
                        <BuyListingButton directListing={listing} marketplace={marketplace} />
                      ) : !isTokenApproved &&
                        listing.currencyContractAddress !== "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE" ? (
                        <ApprovalButtonERC20
                          currencyContractAddress={listing.currencyContractAddress}
                          amount={listing.pricePerToken.toString()}
                          onApproved={() => setIsTokenApproved(true)} />
                      ) : (
                        isTokenApproved &&
                        listing.currencyContractAddress !== "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE" &&
                        account && (
                          <BuyListingButtonErc20
                            marketplace={marketplace}
                            directListing={listing}
                            account={account.address as `0x${string}`} />
                        )
                      )}
                    </>
                  )}

                  <Button
                    size="lg"
                    variant="filled"
                    onClick={inc}
                    disabled={idNumber + 1 >= filteredListings.length}
                    style={{
                      backgroundColor: "#61dafb",
                      color: "#121212",
                      padding: "0.5rem 1.5rem",
                    }}
                  >
                    Next
                  </Button>
                </Group>
              </Stack>
            </Card><Divider my="sm" style={{ borderColor: "#61dafb", paddingBottom: "50px" }} /></>

          ) : (
            <Text>Currently, there are no listings on this chain.</Text>
          )}
            </div>

      );          
  };