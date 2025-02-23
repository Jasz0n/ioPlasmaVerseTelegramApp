/**
 * **NFT Card Component**
 * -----------------------------------
 * **Purpose:**
 * - Displays **NFT images, metadata, ranking, and price information**.
 * - Fetches **on-chain metadata** and **displays it dynamically**.
 *
 * **Props:**
 * @param {bigint} tokenId - The NFT Token ID.
 * @param {string} contractAddresse - The NFT Contract Address.
 * @param {number} chainId - The blockchain Chain ID.
 * @param {boolean} [autoShowInfo] - If `true`, automatically expands info.
 */

import  { FC, useCallback, useEffect,  useState } from "react";
import { MediaRenderer, useActiveAccount } from "thirdweb/react";
import styles from "./NftCard2.module.css";
import {  defineChain, getContract,  ThirdwebContract } from "thirdweb";
import { ownerOf, tokenURI } from "thirdweb/extensions/erc721";
import axios from "axios";
import { Badge, Card, Divider, Skeleton, Text } from "@mantine/core";
import { PUNKSRanking, SpunksRankingNew } from "./contractAbi";
import { client } from "@/app/constants";
import { NftInformationPrice } from "./NftInformationPrice";

 /* ---------------------------------------------------------------
 🔢 **Helper functions to getRankings**
   --------------------------------------------------------------- */
const getRanking = (id: string) => {
  const paddedId = id.padStart(3, '0');
  const rankingData = SpunksRankingNew.find((item) => item.spunk === paddedId);
  return rankingData ? rankingData.ranking : null;
};

const getPunkRank = (id: string) => {
  const punkData = PUNKSRanking[id as keyof typeof PUNKSRanking];
  if (punkData && typeof punkData === 'object' && 'score' in punkData) {
    return punkData.score;
  }
  return null;
};



interface Attribute {
  trait_type: string;
  value: string | number;
  frequency?: string;
  count?: number;
  image?: string;
}




type ContractMetadata = {
  name: string;
  description: string;
  image: string;
  animation_url?: string;
  vrm_file?: string;
  attributes: Attribute[];
};

type INFTCardProps = {
  tokenId: bigint;
  contractAddresse: string;
  chainId: number;
 autoShowInfo?: boolean; // Add this prop
};

export const NFTCard: FC<INFTCardProps> = ({
  tokenId,
  contractAddresse,
  chainId,
  autoShowInfo,
}) => {
  /* ---------------------------------------------------------------
     State Variables
  --------------------------------------------------------------- */ 
  const account = useActiveAccount();
  const [tokenUriImage, setTokenURI] = useState<string>("");
  const [currentNFT, setCurrentNFT] = useState<ContractMetadata>({
    name: "",
    description: "",
    image: "",
    attributes: [],
  });
  const [showInfo, setShowInfo] = useState(false);
  const [ranking, setRanking] = useState<number | null>(null);
  const [punkRank, setPunkRank] = useState<string | null>(null);
  const [ownerAddress, setOwnerAddress] = useState<string | null>(null);
   /* ---------------------------------------------------------------
     State Variables
  --------------------------------------------------------------- */ 

  const NETWORK = defineChain(chainId);

  const contract: ThirdwebContract = getContract({
    address: contractAddresse || "",
    client,
    chain: NETWORK,
  });
  /* ---------------------------------------------------------------
     ** ✅ Handle Read NFTs that allows to read allmost every collection without cors restriction **
  --------------------------------------------------------------- */ 
  const handleReadNft = useCallback(async () => {
    try {
      const owner = await ownerOf({ contract, tokenId });
      const tokenUri = await tokenURI({ contract, tokenId });
      let  defaultAttributes: Attribute[] = [];

      let metadataUrl;
      if (contractAddresse?.toLowerCase() === "0xec0cd5c1d61943a195bca7b381dc60f9f545a540") {
       
      
        
      
        const NftMetadata = {
          id: tokenId,
          name: "SC Cat",
          description:   "Star Crazy Nr1",
          image: `https://www.ioplasmaverse.com/api/proxy?url=${encodeURIComponent(`https://gamefantasy.com/api/v1/sc/image/${tokenId.toString()}`)}`,
          attributes: [],
          animation_url: "",
          vrm_file:  "",
        };
        console.log("traits",defaultAttributes);
        setOwnerAddress(owner);
        setCurrentNFT(NftMetadata);
      } else if (typeof tokenUri === 'string') {
        if (tokenUri.startsWith("ipfs://")) {
          const gatewayUrl = tokenUri.replace("ipfs://", "https://ipfs.io/ipfs/");
          metadataUrl = `https://nieuwe-map-5.vercel.app/metadata?url=${encodeURIComponent(gatewayUrl)}`;
        } else if (tokenUri.startsWith("data:")) {
          const base64Data = tokenUri.split(",")[1];
          const decodedData = Buffer.from(base64Data, 'base64').toString('utf-8');
          const metadata = JSON.parse(decodedData);

          const proxyImageUrl = `https://nieuwe-map-5.vercel.app/metadataImage?url=${encodeURIComponent(metadata.image)}`;

          const NftMetadata = {
            id: metadata.id || tokenId,
            name: metadata.name || "Unknown Name",
            description: metadata.description || "No Description",
            image: proxyImageUrl,
            attributes: metadata.attributes || [],
            animation_url: metadata.animation_url || "",
            vrm_file: metadata.vrm_url || ""
          };

          setCurrentNFT(NftMetadata);
          setOwnerAddress(owner);
          setTokenURI(tokenUri);
          return;
        } else {
          try {
            const metadata = JSON.parse(tokenUri);

            const proxyImageUrl = `https://nieuwe-map-5.vercel.app/metadataImage?url=${encodeURIComponent(metadata.image)}`;

            const NftMetadata = {
              id: metadata.id || tokenId,
              name: metadata.name || "Unknown Name",
              description: metadata.description || "No Description",
              image: proxyImageUrl,
              attributes: metadata.attributes || "",
              animation_url: metadata.animation_url || "",
              vrm_file: metadata.url || ""
            };

            setCurrentNFT(NftMetadata);
            setOwnerAddress(owner);
            setTokenURI(tokenUri);
            return;
          } catch (error) {
            metadataUrl = `https://nieuwe-map-5.vercel.app/metadata?url=${encodeURIComponent(tokenUri)}`;
          }
        }

        const response = await axios.get(metadataUrl);

        if (response.data) {
          const NftMetadata = {
            id: response.data.id || tokenId,
            name: response.data.name || "Unknown Name",
            description: response.data.description || "No Description",
            image: response.data.image,
            attributes: response.data.attributes || "",
            animation_url: response.data.animation_url || "",
            vrm_file: response.data.vrm_url || ""
          };

          setCurrentNFT(NftMetadata);
          setOwnerAddress(owner);
          setTokenURI(tokenUri);

          if (contractAddresse === "0xc52121470851d0cba233c963fcbb23f753eb8709") {
            const ranking = getRanking(tokenId.toString());
            setRanking(ranking);
          } else {
            setRanking(null);
          }

          if (contractAddresse === "0xce300b00aa9c066786D609Fc96529DBedAa30B76") {
            const rank = getPunkRank(tokenId.toString());
            if (rank !== null) {
              setPunkRank(rank.toString());
            } else {
              setPunkRank(null);
            }
          } else {
            setPunkRank(null);
          }
        } else {
          console.error("Invalid metadata response:", response.data);
        }
      } else {
        console.error("Invalid token URI format:", tokenUri);
      }
    } catch (error) {
      console.error("Error fetching metadata:", error);
    }
  }, [contract, tokenId, contractAddresse]); 

    
  const handleButtonClickOpen = () => {
    if (showInfo == false) {
    setShowInfo(true);
    console.log("showInfo", showInfo)

    }
  };
 
  useEffect(() => {
    if (autoShowInfo) {
      setShowInfo(true);
    }
  }, [autoShowInfo]);

  useEffect(() => {
    handleReadNft();
  }, [handleReadNft]);

  /* ---------------------------------------------------------------
   JSX Rendering
--------------------------------------------------------------- */ 
  
  return (
    
    <Card
      shadow="lg"
      radius="md"
      withBorder
      style={{
        backgroundColor: "rgba(255, 255, 255, 0.08)", 
        border: "1px solid rgba(97, 218, 251, 0.3)",
        width: "330px",  
        color: "#f5f5f5",
        padding: "1rem",
        marginBottom: "1rem",
      }}
      onClick={() => handleButtonClickOpen()}
      role="button"
      aria-label="Show more info"
    >
      {/* Owner Tag */}
      {account && ownerAddress === account.address && (
        <Badge
          color="teal"
          variant="filled"
          style={{
            position: "absolute",
            top: "10px",
            right: "10px",
          }}
        >
          Owned by You
        </Badge>
      )}
  
      {/* NFT Image */}
      <div style={{ textAlign: "center", marginBottom: "1rem" }}>
      {currentNFT.image&& (

<div
  style={{
    width: "300px", 
    height: "300px",
    overflow: "hidden",
    borderRadius: "8px", 
    display: "flex",
    paddingTop: "18px", 
    alignItems: "center",
    justifyContent: "center",
  }}
>
  {currentNFT.image && (
    <MediaRenderer
      src={currentNFT.animation_url || currentNFT.image || tokenUriImage}
      client={client}
      style={{
        width: "100%", 
        height: "100%", 
        objectFit: "contain", 
      }}
    />
  )}
</div>        )}
      </div>
      <div style={{ textAlign: "center", marginBottom: "0.5rem" }}>

      {currentNFT ? (
    <>
      {contractAddresse?.toLowerCase() !== "0xc52121470851d0cba233c963fcbb23f753eb8709".toLowerCase() &&
        contractAddresse?.toLowerCase() !== "0xce300b00aa9c066786D609Fc96529DBedAa30B76".toLowerCase() && (
          <Text
            size="sm"
            style={{ marginTop: "0.5rem", color: "#a8dadc",fontWeight: 600 }}
          >
            Token ID #{tokenId.toString()}
          </Text>
        )}

      {/* Ranking */}
      {contractAddresse?.toLowerCase() === "0xc52121470851d0cba233c963fcbb23f753eb8709".toLowerCase() && ranking && (
        <Text
          size="sm"
          style={{ marginTop: "0.5rem", color: "#a8dadc",fontWeight: 600 }}
          >
          Rank #{ranking}
        </Text>
      )}

      {/* Punk Rank */}
      {contractAddresse?.toLowerCase() === "0xce300b00aa9c066786D609Fc96529DBedAa30B76".toLowerCase() && punkRank && (
        <Text
          
          size="sm"
          style={{ marginTop: "0.5rem", color: "#a8dadc",fontWeight: 600 }}
          >
          RANK #{punkRank}
        </Text>
      )}

      
    
      {/* Price Container */}
        {contractAddresse ? (
            <div className={styles.priceContainer}>
            <NftInformationPrice
                            contractAddress={contractAddresse || ""}
                            tokenId={tokenId}  
                            chainId={chainId}                          
                            />
            </div>
        ) : (
            <Skeleton />
        )}
        </>
    ) : (
        <Skeleton />
    )}
    </div>
    
               {/* NFT Description */}
      <Divider my="sm" style={{ borderColor: "#a8dadc" }} />
      <Text
        size="sm"
        color="dimmed"
        style={{
          color: "#a8dadc",
          textAlign: "center",
          maxHeight: "4rem",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {currentNFT.description || "No description available."}
      </Text>          
    </Card>
  );
};  
 
