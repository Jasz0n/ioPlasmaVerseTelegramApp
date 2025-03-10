"use client"; // ✅ Add this at the top

import { getContract, defineChain } from "thirdweb";
import { client } from "@/app/constants";
export const ETHERSCAN_URL = "https://iotexscan.io";
export const NETWORK = defineChain(4689);
export const NETWORK2 = defineChain(4690);



const SOcial = "0xcA06107e6291a5aB0821B08BD2bA92f3743B6266";
  export const socialChatContract= getContract({
    address: SOcial,
    client,
    chain: NETWORK2,
  });


  const Cooffee = "0xdb369f3B132E39175Be74beA8886bc6041F92DF7";
  export const BuyCoffeeContract= getContract({
    address: Cooffee,
    client,
    chain: NETWORK,
  });

  const SC = "0xec0cd5c1d61943a195bca7b381dc60f9f545a540";
  export const StarCrazyContract= getContract({
    address: SC,
    client,
    chain: NETWORK2,
  });


  const Webstream = "0x8aa9271665e480f0866d2F61FC436B96BF9584AD";
  export const WebStreamContract= getContract({
    address: Webstream,
    client,
    chain: NETWORK,
  });

  const Pipie = "0xe1Bb99ed442ce6c6ad3806C3afcbd8f7733841A7";
  export const MimoPipiContract= getContract({
    address: Pipie,
    client,
    chain: NETWORK,
  });

  const Binby = "0xaa5314f9ee6a6711e5284508fec7f40e85969ed6";
  export const MimoBimbyContract= getContract({
    address: Binby,
    client,
    chain: NETWORK,
  });

  const Gizy = "0x0689021f9065b18c710f5204e41b3d20c3b7d362";
  export const MimoGizyContract= getContract({
    address: Gizy,
    client,
    chain: NETWORK,
  });

  const iotexPunks = "0xce300b00aa9c066786D609Fc96529DBedAa30B76";
  export const IotexPunksContract= getContract({
    address: iotexPunks,
    client,
    chain: NETWORK,
  });

  

  const Albie = "0x8cfE8bAeE219514bE529407207fCe9C612E705fD";
  export const MimoAlbieContract= getContract({
    address: Albie,
    client,
    chain: NETWORK,
  });

  const Space = "0x778E131aA8260C1FF78007cAde5e64820744F320";
  export const MimoSpaceContract= getContract({
    address: Space,
    client,
    chain: NETWORK,
  });

  const galaxe3 = "0x7f37290ea2d4b25dc92869ad127c38db273df8ee";
  export const galazyContract3= getContract({
    address: galaxe3,
    client,
    chain: NETWORK,
  });

  const IotexGalaxy = "0x7f37290ea2d4b25dc92869ad127c38db273df8ee";
  export const iotexGalaxyContract3= getContract({
    address: IotexGalaxy,
    client,
    chain: NETWORK,
  });

  const galaxe1 = "0x50b39041d55e7a1f24e9013916f894255cdfca8b";
  export const galazyContract1= getContract({
    address: galaxe1,
    client,
    chain: NETWORK,
  });
  const galaxe2 = "0xd40171fa36990a81eb528e10a151b492b0df55a4";
  export const galazyContract2= getContract({
    address: galaxe2,
    client,
    chain: NETWORK,
  });
  const galaxe4 = "0x8ffcd1b97639d0be0f9ec18e97cec1ab03a8bb10";
  export const galazyContract4= getContract({
    address: galaxe4,
    client,
    chain: NETWORK,
  });
  const powerpod = "0x3acd87176676e9b93f823e5e5e1d3069171c985d";
  export const powerPodContract= getContract({
    address: powerpod,
    client,
    chain: NETWORK,
  });
  const xSumo = "0x7d150d3eb3ad7ab752df259c94a8ab98d700fc00";
  export const XSumoContract= getContract({
    address: xSumo,
    client,
    chain: NETWORK,
  });

  const Sumo = "0x9756e951dd76e933e34434db4ed38964951e588b";
  export const SumoContractContract = getContract({
    address: Sumo,
    client,
    chain: NETWORK,
  });

  const loxo = "0x7f8cb1d827f26434da652b4e9bd02c698cc2842a";
  export const LoxodromeContract = getContract({
    address: loxo,
    client,
    chain: NETWORK,
  });

  const Buzz = "0xdfbbeba6d17b0d49861ab7f26cda495046314370";
  export const BuzzBotsContract = getContract({
    address: Buzz,
    client,
    chain: NETWORK,
  });
  const Robot = "0xaf1b5063a152550aebc8d6cb0da6936288eab3dc";
  export const RobotAiContract = getContract({
    address: Robot,
    client,
    chain: NETWORK,
  });
  const Spunks = "0xc52121470851d0cba233c963fcbb23f753eb8709";
  export const SpunksContract = getContract({
    address: Spunks,
    client,
    chain: NETWORK,
  });


  const MachinFfi = "0x0c5AB026d74C451376A4798342a685a0e99a5bEe";
  export const MachinFiContract = getContract({
    address: MachinFfi,
    client,
    chain: NETWORK,
  });

  const AppMintContract = "0x9C023CD4E58466424B7f60B32004c6B9d5596140";
export const Appmint = getContract({
	address: AppMintContract,
	client,
	chain: NETWORK,
});
  
const MARKETPLACE_ADDRESS = "0xF87c2066577f2e1c799C4e5628d578B623F5481f";
export const MARKETPLACE = getContract({
	address: MARKETPLACE_ADDRESS,
	client,
	chain: NETWORK,
});

const UCAM = "0x30582ede7fadeba4973dd71f1ce157b7203171ea";
export const UCAMContract = getContract({
	address: UCAM,
	client,
	chain: NETWORK,
});

const Pebble = "0xe6df6f666be3d9d4060d14de4c4e778e1addb912";
export const PebblePionier = getContract({
	address: Pebble,
	client,
	chain: NETWORK,
});
const cmc = "0xb8403ffba4d0af0e430b128c5569e335ec00c4c9";
export const cmcStaking = getContract({
	address: cmc,
	client,
	chain: NETWORK,
});

const burn = "0x8d1fdef8e955eb81267af67cdec9b7f2c688faa5";
export const burnDrop = getContract({
	address: burn,
	client,
	chain: NETWORK,
});

const ioSibaErc20 = "0x3ea683354bf8d359cd9ec6e08b5aec291d71d880";
export const ioShiba = getContract({
	address: ioSibaErc20,
	client,
	chain: NETWORK,
});

const ioUsdc = "0x3B2bf2b523f54C4E454F08Aa286D03115aFF326c";
export const ioUSDCondract = getContract({
	address: ioUsdc,
	client,
	chain: NETWORK,
});

const Chatt = "0xAc8B079756eD852c6ed7bEc178F158F474b0625b";
export const ChattApp = getContract({
	address: Chatt,
	client,
	chain: NETWORK,
});

const Chatt2 = "0x1b7AAb1973F352886117A5C3fCD51866d1beA0DD";
export const ChattApp2 = getContract({
	address: Chatt2,
	client,
	chain: NETWORK,
});



const ProfileImage = "0x139929A597B91ea89F41026b65b281611890F13B";
export const AppMint = getContract({
	address: ProfileImage,
	client,
	chain: NETWORK,
});

// 3. The address of your NFT collection smart contract.
const NFT_COLLECTION_ADDRESS = "0xbC4027183E1FD5CC00218f846Ed953b6053a17F2";
export const NFT_COLLECTION = getContract({
	address: NFT_COLLECTION_ADDRESS,
	client,
	chain: NETWORK,
});

const Product = "0xa8d80A16dAFC559Bf2af9e6e295b412960A49626";
export const PlasmaProduct = getContract({
	address: Product,
	client,
	chain: NETWORK,
});

const merch = "0x5e918C1F6fC2dE1A1b57D6a2d731F767CE0830B4";
export const Merchendise = getContract({
	address: merch,
	client,
	chain: NETWORK,
});

export const predictionAddress = "0x57E9dE461C50A21Ee2Be84b7AFdFf946d5EaB03c";

export const prediction = getContract({
    client: client,
    chain: NETWORK,
    address: predictionAddress
});

export const tokenAddress = "0xa00744882684c3e4747faefd68d283ea44099d03";


export const tokenContract = getContract({
    client: client,
    chain: NETWORK,
    address: tokenAddress
});