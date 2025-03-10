"use client";

import React, { createContext, useContext, useEffect, ReactNode, useState, useCallback } from 'react';
import {  WebStreamContract, MachinFiContract, MimoAlbieContract, MimoBimbyContract, MimoGizyContract, MimoPipiContract, LoxodromeContract, SumoContractContract, XSumoContract, RobotAiContract, BuzzBotsContract, SpunksContract, NFT_COLLECTION, AppMint, IotexPunksContract, powerPodContract, galazyContract1, galazyContract2, galazyContract3, galazyContract4, iotexGalaxyContract3, PebblePionier, UCAMContract, cmcStaking, burnDrop } from './contracts';
import {  ThirdwebContract } from "thirdweb";
import { useActiveAccount } from "thirdweb/react";
import { readContract, resolveMethod } from "thirdweb";
import { getOwnedNFTs } from "thirdweb/extensions/erc721";

type UserContextType = {
  ownedNfts3: { [key: string]: number[] };
    ownedNfts2: { [key: string]: number[] };
    ownedNfts: { [key: string]: string[] };
    signerAddress: string | undefined;
};



// Create a context
const NftContext = createContext<UserContextType | undefined>(undefined);

interface UserProviderProps {
    children: ReactNode;
}

export const NftProvider: React.FC<UserProviderProps> = ({ children }) => {
    const account = useActiveAccount();

    const [signerAddress, setSignerAddress] = useState<string | undefined>(undefined);
    const [ownedNfts3, setOwnedNfts3] = useState<{ [key: string]: number[] }>({});
    const [ownedNfts] = useState<{ [key: string]: string[] }>({});
    const [ownedNfts2, setOwnedNfts2] = useState<{ [key: string]: number[] }>({});

    const fetchOwnedNfts = useCallback(async (contractAddress: string, contract: ThirdwebContract) => {
      if (!account) return;

      try {

          const ownedNFTs = await getOwnedNFTs({
              contract,
              owner: account?.address,
          });


          const ids = ownedNFTs.map(nft => Number(nft.id));

          setOwnedNfts2(prevState => {
              const updatedNfts = { ...prevState, [contractAddress]: ids };
              return updatedNfts;
          });
          setOwnedNfts3(prevState => {
            const updatedNfts = { ...prevState, [contractAddress]: ids };
            return updatedNfts;
        });
      } catch (err) {
          
      } finally {
      }
  }, [account]);
      
    const fetchOwnedNfts2 = useCallback(async (
        signerAddress: string | undefined,
        contract: ThirdwebContract,
        contractAddress: string,
        totalIds: number,
        batchSize: number,
        newFetch: number
      ) => {
        if (!contract || !signerAddress) return;
      
        const ownedIds: number[] = [];
      
        const fetchBatch = async (start: number, end: number) => {
          const promises = [];
          for (let i = start; i < end; i++) {
            const promise = readContract({
              contract,
              method: resolveMethod("ownerOf"),
              params: [i]
            }).catch(error => {
              console.log(error)

              return null;
            }) as unknown as Promise<string>;
            promises.push(promise);
          }
      
          const results = await Promise.allSettled(promises);
      
          results.forEach((result, index) => {
            const nftId = start + index;
            if (result.status === 'fulfilled' && result.value) {
              const ownerAddress = (result.value as string).toLowerCase();
              if (ownerAddress === signerAddress.toLowerCase()) {
                ownedIds.push(nftId);
              }
            } else if (result.status === 'rejected') {
            }
          });
        };
      
        try {
          for (let i = 0; i < totalIds; i += batchSize) {
            await fetchBatch(i, Math.min(i + batchSize, totalIds));
            if (i + batchSize >= newFetch) {
              break;
            }
          }
        } finally {
          setOwnedNfts2((prevState) => {
            const updatedNfts2 = { ...prevState, [contractAddress]: ownedIds };
            return updatedNfts2;
          });
          setOwnedNfts3((prevState) => {
            const updatedNfts2 = { ...prevState, [contractAddress]: ownedIds };
            return updatedNfts2;
          });
      
        }
      }, []);

      const fetchOwnedNfts3 = useCallback(async (
        signerAddress: string | undefined,
        contract: ThirdwebContract,
        contractAddress: string,
        totalIds: number,
        batchSize: number,
        newFetch: number
      ) => {
        if (!contract || !signerAddress) return;
      
        const ownedIds: number[] = [];
      
        const fetchBatch = async (start: number, end: number) => {
          const promises = [];
          for (let i = start; i < end; i++) {
            const promise = readContract({
              contract,
              method: resolveMethod("ownerOf"),
              params: [i]
            }).catch(() => {
              return null;
            }) as unknown as Promise<string>;
            promises.push(promise);
          }
      
          const results = await Promise.allSettled(promises);
      
          results.forEach((result, index) => {
            const nftId = start + index;
            if (result.status === 'fulfilled' && result.value) {
              const ownerAddress = (result.value as string).toLowerCase();
              if (ownerAddress === signerAddress.toLowerCase()) {
                ownedIds.push(nftId);
              }
            } else if (result.status === 'rejected') {
            }
          });
        };
      
        try {
          for (let i = 0; i < totalIds; i += batchSize) {
            await fetchBatch(i, Math.min(i + batchSize, totalIds));
            if (i + batchSize >= newFetch) {
              break;
            }
          }
        } finally {
          
          setOwnedNfts3((prevState) => {
            const updatedNfts2 = { ...prevState, [contractAddress]: ownedIds };
            return updatedNfts2;
          });
      
        }
      }, []);

  
      useEffect(() => {
        if (account) {
          const signerAddress = account.address;
          fetchOwnedNfts3(signerAddress, AppMint, '0x9C023CD4E58466424B7f60B32004c6B9d5596140', 100, 50, 90)
          fetchOwnedNfts2(signerAddress, NFT_COLLECTION, '0xbC4027183E1FD5CC00218f846Ed953b6053a17F2', 100, 50, 90)

          fetchOwnedNfts2(signerAddress, WebStreamContract, '0x8aa9271665e480f0866d2F61FC436B96BF9584AD', 838, 150, 830)
          .then(() =>  fetchOwnedNfts2(signerAddress, IotexPunksContract,'0xce300b00aa9c066786D609Fc96529DBedAa30B76',10000,150,9990))
          
          .then(() => fetchOwnedNfts2(signerAddress, PebblePionier, '0xe6df6f666be3d9d4060d14de4c4e778e1addb912', 186, 30, 180))
          .then(() => fetchOwnedNfts2(signerAddress, UCAMContract, '0x30582ede7fadeba4973dd71f1ce157b7203171ea', 105, 30, 90))

          .then(() => fetchOwnedNfts2(signerAddress, MimoPipiContract, '0xe1Bb99ed442ce6c6ad3806C3afcbd8f7733841A7', 1000, 150, 990))
          .then(() => fetchOwnedNfts2(signerAddress, MimoAlbieContract, '0x8cfE8bAeE219514bE529407207fCe9C612E705fD', 946, 150, 930))

          .then(() =>  fetchOwnedNfts2(signerAddress, iotexGalaxyContract3,'0x7f37290ea2d4b25dc92869ad127c38db273df8ee',1000,100,999))
          fetchOwnedNfts2(signerAddress, MimoAlbieContract, '0x8cfE8bAeE219514bE529407207fCe9C612E705fD', 946, 150, 930)
         fetchOwnedNfts2(signerAddress, MimoBimbyContract, '0xaa5314f9ee6a6711e5284508fec7f40e85969ed6', 1000, 150, 990)
         .then(() => fetchOwnedNfts2(signerAddress, MimoGizyContract, '0x0689021f9065b18c710f5204e41b3d20c3b7d362', 1000, 150, 990))
         
            .catch(() => {
              
            });
        }
      }, [account,fetchOwnedNfts3 ,fetchOwnedNfts2]);
   
      
     
      
        useEffect(() => {
          if (account) {
              setSignerAddress(account.address);
              


              fetchOwnedNfts("0x0c5AB026d74C451376A4798342a685a0e99a5bEe", MachinFiContract);
              fetchOwnedNfts("0x9756e951dd76e933e34434db4ed38964951e588b", SumoContractContract);
              fetchOwnedNfts("0x7d150d3eb3ad7ab752df259c94a8ab98d700fc00", XSumoContract);
              fetchOwnedNfts("0x7f8cb1d827f26434da652b4e9bd02c698cc2842a", LoxodromeContract);
              fetchOwnedNfts("0xdfbbeba6d17b0d49861ab7f26cda495046314370", BuzzBotsContract);
              fetchOwnedNfts("0xaf1b5063a152550aebc8d6cb0da6936288eab3dc", RobotAiContract);             
              fetchOwnedNfts("0xc52121470851d0cba233c963fcbb23f753eb8709", SpunksContract);
              fetchOwnedNfts("0x8d1fdef8e955eb81267af67cdec9b7f2c688faa5", burnDrop);

              fetchOwnedNfts("0xb8403ffba4d0af0e430b128c5569e335ec00c4c9", cmcStaking);

              fetchOwnedNfts("0x3acd87176676e9b93f823e5e5e1d3069171c985d", powerPodContract);
              fetchOwnedNfts("0x8ffcd1b97639d0be0f9ec18e97cec1ab03a8bb10", galazyContract4);
              fetchOwnedNfts("0xd40171fa36990a81eb528e10a151b492b0df55a4", galazyContract2);             
              fetchOwnedNfts("0x50b39041d55e7a1f24e9013916f894255cdfca8b", galazyContract1);
              fetchOwnedNfts("0x7f37290ea2d4b25dc92869ad127c38db273df8ee", galazyContract3);


          }
      }, [account, fetchOwnedNfts]);

     

    useEffect(() => {
        if (account) {
            setSignerAddress(account.address);
        }
    }, [account]);

    return (
        <NftContext.Provider value={{
            ownedNfts3,
            ownedNfts2,

            ownedNfts,
            signerAddress,
        }}>
            {children}
        </NftContext.Provider>
    );
};

export const useNfts = (): UserContextType => {
    const context = useContext(NftContext);
    if (!context) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
};
