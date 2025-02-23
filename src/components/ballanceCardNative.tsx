"use client";

/**
 * **BalanceCardNative Component**
 * --------------------------------
 * **Purpose:**
 * - Displays **user's native token balance** on a specific chain.
 * - Fetches the **user's name** based on their address.
 * - Allows users to **send funds** via a modal.
 *
 * **Props:**
 * @param {string} title - Display title for the balance card.
 * @param {string} balance - User's token balance.
 * @param {number} chainId - The blockchain chain ID.
 * @param {Token} WETH - The wrapped native token data.
 * @param {Token} native - The native token data.
 * @param {() => void} setBalanceModalOpen - Function to open the send funds modal.
 *
 * **Features:**
 * - ✅ Fetches **username** using `getUserNameByAddress`.
 * - ✅ Displays **live token balance**.
 * - ✅ Allows **sending funds** using a modal.
 */

import  { FC, useCallback, useEffect, useState } from "react";
import {
  Text,
  Tooltip,
  Button,
  Box,
} from "@mantine/core";
import { useActiveAccount } from "thirdweb/react";
import {
  FiSend,
} from "react-icons/fi"; 
import { readContract, resolveMethod, ThirdwebContract } from "thirdweb";
import { AppMint, ChattApp } from "./functions";

type Token = {
  name: string;
  symbol: string;
  contractAddress: string;
  image: string;
  price?: string;
  value?: string;
  balance?: string; 
  coinCecko?: string;
  hasTax?: boolean;
  decimals: number;
};
type INFTCardProps = {
  title: string;
  balance: string;
  name: string;
  symbol?: string;
  chainId: number;
  WETH: Token;
  native: Token;
  setBalanceModalOpen: () => void; 
};

export const BalanceCardNative: FC<INFTCardProps> = ({
  title,
  balance,
  chainId,
  WETH,
  native,
  setBalanceModalOpen
}) => {
  /* ---------------------------------------------------------------
     State Variables
  --------------------------------------------------------------- */ 
  const account = useActiveAccount();
  const [userName, setUserName] = useState<string>("");

  
  /**
   * **Fetch User Name**
   * Retrieves the username associated with a given wallet address.
   * @param {string | null} address - User's wallet address.
   * @param {ThirdwebContract} contract - Smart contract for name resolution.
   */
    const fetchUserName = useCallback(async (address: string | null, contract: ThirdwebContract) => {
      if (!address) return;
      try {
        const name = await readContract({
          contract,
          method: resolveMethod("getUserNameByAddress"),
          params: [address],
        }) as unknown as string;
  
        setUserName(name);
      } catch (error) {
        console.error("Error fetching username:", error);
      }
    }, []);
  
    /* ---------------------------------------------------------------
     State Variables
  --------------------------------------------------------------- */ 
   const handleFetchUserData = useCallback(
      async (message: string) => {
        try {
          
  
          await Promise.all([
            fetchUserName(message.toString(), ChattApp),
          ]);
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      },
      [ fetchUserName] );
    /* ---------------------------------------------------------------
     State Variables
  --------------------------------------------------------------- */ 
  
    useEffect(() => {
      if (account) {
        fetchUserName(account.address.toString(), ChattApp);
      }
    }, [account, fetchUserName]);
 

     /* ---------------------------------------------------------------
   JSX Rendering
  --------------------------------------------------------------- */


return (

  <>
  <Box
    style={{
      background: "linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))",
      backdropFilter: "blur(20px)",
      borderRadius: "15px",
      color: "#f5f5f5",
      boxShadow: "0 10px 20px rgba(0,0,0,0.3)",
      border: "1px solid rgba(255,255,255,0.15)",
      position: "relative",
      padding: "15px",
      overflow: "hidden",
      height: "145px",
      display: "flex",
      alignItems: "center", // Keeps everything on the same level
      justifyContent: "space-between", // Proper spacing
    }}>

    <><Box style={{ textAlign: "left", flex: 1 }}>
        <Text size="lg" style={{ fontWeight: 700, color: "#ffffff" }}>
          {title} {chainId}
        </Text>
        <Text size="sm" style={{ color: "#00d1b2", fontWeight: 500 }}>
        Balance: {balance && !isNaN(Number(balance)) ? Number(balance).toFixed(4) : "0.0000"} {native?.symbol || ""}
        </Text>
        <Text size="xs" style={{ color: "#bbb" }}>
          1 {native.symbol} = ${WETH.price}
        </Text>
      </Box><Box style={{ flexShrink: 0, textAlign: "center" }}>
          <Tooltip label={userName || "Unnamed"} position="top" withArrow>
            <div style={{ position: "relative", display: "inline-block" }}>
              <img
                src={native?.image}
                alt={userName || "User Profile"}
                width={50}
                height={50}
                style={{
                  borderRadius: "50%",
                  border: "3px solid rgba(97, 218, 251, 0.8)",
                  boxShadow: "0 0 10px rgba(97, 218, 251, 0.5)",
                  cursor: "pointer",
                }} />
              
            </div>
          </Tooltip>
        </Box><Box style={{ flexShrink: 0 }}>
          <Tooltip label="Send funds" position="top" withArrow>
            <Button
              variant="outline"
              radius="xl"
              onClick={() => setBalanceModalOpen()}

              style={{
                border: "1px solid #61dafb",
                backgroundColor: "rgba(255,255,255,0.05)",
                color: "#61dafb",
                fontSize: "14px",
                fontWeight: "bold",
                padding: "8px 14px",
                transition: "all 0.3s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#61dafb")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.05)")}
            >
              <FiSend style={{ fontSize: "18px", marginRight: "5px" }} /> Send
            </Button>
          </Tooltip>
        </Box></>

  </Box>

    
    
</>
);
};


