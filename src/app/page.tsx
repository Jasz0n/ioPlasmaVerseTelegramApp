"use client";
/**
 * ============================================================
 * 🏠 Home Component (Telegram Multi-App)
 * ============================================================
 * 📌 Purpose:
 *    - Provides a decentralized trading platform for users in Telegram.
 *    - Supports multiple features including Wallet, Swap, NFT Market, and Admin Panel.
 *    - Uses Telegram WebApp API to fetch user and group details dynamically.
 *
 * 📌 Features:
 *    - Connects wallet using `thirdweb/react` and auto-connects on page load.
 *    - Displays real-time token prices using a shuffled list of assets.
 *    - Supports group administration if the user is an Admin or Founder.
 *    - Uses `useRouter` and `useSearchParams` for dynamic navigation.
 *    - Ensures a **responsive, mobile-first** layout tailored for Telegram Mini Apps.
 *    - Implements a **fixed bottom navigation bar** for seamless UX.
 *
 * 📌 Technologies Used:
 *    - Next.js with App Router
 *    - React Hooks (`useEffect`, `useState`, `useMemo`, `useCallback`)
 *    - Thirdweb SDK for Web3 interactions
 *    - Mantine UI for styling
 *
 * 📌 Author: [Jason]
 * 📌 Last Updated: [22-2-2025]
 * ============================================================
 */

import Image from "next/image";
import { ConnectButton, useActiveAccount } from "thirdweb/react";
import { client, wallet } from "./constants";
import { Box, Button, Card, Select, Stack, Text } from "@mantine/core";
import { WalletDetails } from "@/components/WalletModal";
import SwapInterface from "@/components/PlasmaDex";
import { NftMarket } from "@/components/NftMarket";
import { HiHome } from "react-icons/hi2";
import { BiWallet } from "react-icons/bi";
import { BsBank } from "react-icons/bs";
import { Suspense, useCallback, useEffect, useState } from "react";
import { useCurrency } from "@/hooks/currency";
import { useRouter,useSearchParams } from "next/navigation"; // ✅ Correct import
import { ImImage } from "react-icons/im";
import AdminDashboard from "@/components/AdminSettings";
import { FiSettings } from "react-icons/fi";
import { defineChain } from "thirdweb";
import { Nft } from "@/components/NFT";
import { MARKETPLACE } from "@/hooks/contracts";
import { UNISWAP_CONTRACTS } from "@/components/types";

/* ---------------------------------------------------------------
   Home Component (Telegram DEX)
--------------------------------------------------------------- */

export default function Home() {
   /* ---------------------------------------------------------------
     State Variables
  --------------------------------------------------------------- */  
  const [params, setParams] = useState({ userId: "", groupId: "", isAdmin: false, isFounder: false });
  const [activeTab, setActiveTab] = useState<"home" | "wallet" | "swap"| "admin" | "nft">("home");
  const { tokenBalances, router, chainId, nftCollection,feeReciever,tokenList, marketplace, WETH9, setChainId} = useCurrency();
  const [userData, setUserData] = useState<any>(null);
  const [authError, setAuthError] = useState("");
  const tokens = tokenBalances;
  const token = tokenBalances.length > 0 ? tokenBalances : tokenList;
  const [shuffledTokens, setShuffledTokens] = useState(tokens.slice(0, 3));
  

   /* ---------------------------------------------------------------
     Fetch Telegram WebApp User & Group Data
  --------------------------------------------------------------- */
  
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    setParams({
      userId: searchParams.get("userId") || "",
      groupId: searchParams.get("groupId") || "",
      isAdmin: searchParams.get("isAdmin")?.toLowerCase() === "true",
      isFounder: searchParams.get("isFounder")?.toLowerCase() === "true",
    });
  }, []);

 
   /* ---------------------------------------------------------------
     Live Token Price Updates (Every 3 Seconds)
  --------------------------------------------------------------- */

  
  useEffect(() => {
    const updateTokens = () => {
      setShuffledTokens([...tokens].sort(() => Math.random() - 0.5).slice(0, 3));
    };
  
    // Set interval to update every 3 seconds
    const interval = setInterval(updateTokens, 3000);
  
    // Cleanup interval when component unmounts
    return () => clearInterval(interval);
  }, [tokens]); // ✅ Depend on `tokens` but avoid instant re-shuffling
    

  useEffect(() => {
    if (typeof window !== "undefined") {
      const checkTelegramWebApp = () => {
        if (window.Telegram?.WebApp) {
          console.log("✅ Telegram WebApp Detected");
          const tg = window.Telegram.WebApp;
          
          tg.expand(); 
          
          if (tg.initDataUnsafe?.user) {
            const userId = tg.initDataUnsafe.user.id;
            const username = tg.initDataUnsafe.user.username || "Unknown";
            console.log("🔹 Telegram User:", { userId, username });
  
            setUserData({ userId, username });
  
            
          } else {
            console.error("❌ Unable to fetch user data from Telegram.");
            setAuthError("Failed to retrieve user data.");
          }
        } else {
          console.error("❌ Telegram WebApp not detected.");
          setAuthError("This app must be opened inside Telegram.");
        }
      };
  
      setTimeout(checkTelegramWebApp, 2500); 
    }
  }, []);
  
  
  /* ---------------------------------------------------------------
   JSX Rendering
--------------------------------------------------------------- */
  return (
<main
        style={{
          height: "90vh",
          width: "100vw",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center", 
          alignItems: "center",
          position: "relative",
        }}
      >      
      <Box
        style={{
          width: "100%",
          height: "90%",
          flexGrow: 1, 
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          paddingBottom: "70px",
        }}
      >
        <div style={{justifyContent: "center"}}>
        {/* HOME SECTION */}
        {activeTab === "home" && (
          <Card
            shadow="xl"
            radius="xl"
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.08)",
              color: "white",
              padding: "2rem",
              borderRadius: "16px",
              textAlign: "center",
              width: "100%",
              paddingBottom: "5rem", 
            }}
          >
            {/* ✅ Featured Banner */}
            <Image
              src="/dex-banner.png"
              alt="Telegram DEX"
              width={80} 
              height={80} 
              style={{
                borderRadius: "12px",
                marginBottom: "15px",
                objectFit: "contain", 
              }}
            />
             <Text size="xl" style={{ color: "#61dafb", fontWeight: 700 }}>
             Select Chain
            </Text>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px", marginTop: "10px" }}>
            {Object.entries(UNISWAP_CONTRACTS).map(([chainName, chainData]) => (
              <Button key={chainData.chainId} onClick={() => setChainId(Number(chainData.chainId))} style={{ backgroundColor: chainId === chainData.chainId ? "#61dafb" : "#ffffff", color: chainId === chainData.chainId ? "black" : "#61dafb", borderRadius: "8px", width: "80%" }}>
                {chainName}
              </Button>
            ))}
          </div>

            {/* ✅ Welcome Message */}
            <Text size="xl" style={{ color: "#61dafb", fontWeight: 700 }}>
              🚀 Welcome to Telegram DEX!
            </Text>
            <Text size="sm" style={{ opacity: 0.8 }}>
              Your go-to decentralized trading platform.
            </Text>

            {/* ✅ User Info */}
            {authError ? (
              <Text style={{ color: "red" }}>{authError}</Text>
            ) : userData ? (
              <Box style={{ marginTop: "10px" }}>
                <Text>
                  ✅ Logged in as <strong>{userData.username}</strong> (ID: {userData.userId})
                </Text>
                {params.groupId && (
                  <Text>
                    📢 Group ID: <strong>{params.groupId}</strong>
                    {params.isFounder ? " 👑 (Founder)" : params.isAdmin ? " 🔧 (Admin)" : ""}
                  </Text>
                )}
              </Box>
            ) : (
              <Text>🔄 Loading user info...</Text>
            )}

            {/* ✅ Group Earnings (For Admins/Founders) */}
            {(params.isAdmin || params.isFounder) && Number(userData?.userId) === Number(params.userId) &&  (
              <Card
                shadow="sm"
                radius="md"
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                  color: "white",
                  padding: "1rem",
                  marginTop: "15px",
                }}
              >
                <Text size="md" style={{ color: "#61dafb", fontWeight: 600 }}>
                  🎉 Group Earnings Overview
                </Text>
                <Text>💰 Trading Fees Earned: <strong>coming soon</strong></Text>
                <Text>📊 NFT Sales: <strong>coming soon</strong></Text>
                <Text>🔄 Swaps Processed: <strong>coming soon</strong></Text>

                <Button
                  fullWidth
                  variant="light"
                  onClick={() => setActiveTab("admin")}
                  style={{
                    backgroundColor: "#61dafb",
                    color: "#121212",
                    fontWeight: 600,
                    marginTop: "10px",
                  }}
                >
                  ⚙️ Manage Group
                </Button>
              </Card>
            )}

            {/* ✅ Live Market Prices */}

            <Box
            style={{
              marginTop: "20px",
              padding: "10px",
              backgroundColor: "rgba(255, 255, 255, 0.1)",
              borderRadius: "10px",
            }}
          >
            <Text size="md" style={{ color: "#61dafb", fontWeight: 600 }}>
              📊 Live Market Prices
            </Text>
            {shuffledTokens.map((token, index) => (
              <Text key={index}>
                {index === 0 ? "🪙" : "🐕"} {token.name} = {token.price}
              </Text>
            ))}
          </Box>
            
            {/* ✅ Support & Wallet Connection */}
            <Stack>
              <ConnectButton client={client} chain={defineChain(Number(chainId))} />
            </Stack>

            {/* ✅ Fixed Support Button (Padding Fix) */}
            <Button
              fullWidth
              variant="outline"
              component="a"
              href="https://t.me/ioPlasmaWorld/1"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                marginTop: "20px", // ✅ Increased margin to prevent overlap
                border: "1px solid #ff9800",
                color: "#ff9800",
                fontWeight: 600,
              }}
            >
              🆘 Get Support in Telegram
            </Button>
          </Card>
        )}


      </div>
        {/* WALLET SECTION */}

        {activeTab === "wallet" &&  (
          <WalletDetails chainId={Number(chainId)} setChainId={setChainId}
            tokens={token} WETH9={WETH9} marketplace={marketplace} />
        )}

        {/* SWAP SECTION */}
        {activeTab === "swap" && (
          <SwapInterface routerPlasma={router} chainId={Number(chainId)} tokens={token} WETH9={WETH9} feeReciever={feeReciever} />
        )}
        {/* NFT SECTION */}

        {activeTab === "nft" && (
          <Nft chainId={chainId} contractAddress={nftCollection.toString()} marketplace={MARKETPLACE}/>
        )}

        {/* Admin SECTION */}

        {activeTab === "admin" &&(params.isAdmin || params.isFounder) && Number(userData?.userId) === Number(params.userId) && (
          <AdminDashboard/>
          
        )}
      </Box>
      
      {/* 🔹 FIXED NAVBAR */}
      <Box
        style={{
          position: "fixed",
          bottom: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: "100%", // ✅ Fixed width for Telegram
          backgroundColor: "#1e1e1e",
          padding: "10px",
          borderTop: "1px solid #61dafb",
          display: "flex",
          justifyContent: "space-around",
          alignItems: "center",
          zIndex: 1000, // ✅ Ensures it stays above other elements
        }}
      >
        <Button
          variant="subtle"
          onClick={() => setActiveTab("home")}
          style={{
            color: activeTab === "home" ? "#61dafb" : "#ffffff",
            padding: "10px",
          }}
        >
          <HiHome size={28} />
        </Button>
        <Button
          variant="subtle"
          onClick={() => setActiveTab("wallet")}
          style={{
            color: activeTab === "wallet" ? "#61dafb" : "#ffffff",
            padding: "10px",
          }}
        >
          <BiWallet size={28} />
        </Button>
        <Button
          variant="subtle"
          onClick={() => setActiveTab("swap")}
          style={{
            color: activeTab === "swap" ? "#61dafb" : "#ffffff",
            padding: "10px",
          }}
        >
          <BsBank size={28} />
        </Button>
        <Button
          variant="subtle"
          onClick={() => setActiveTab("nft")}
          style={{
            color: activeTab === "nft" ? "#61dafb" : "#ffffff",
            padding: "10px",
          }}
        >
          <ImImage size={28} />
        </Button>

              {(params.isAdmin || params.isFounder) && Number(userData?.userId) === Number(params.userId) &&  (
        <Button
          variant="subtle"
          onClick={() => setActiveTab("admin")}
          style={{
            color: activeTab === "admin" ? "#61dafb" : "#ffffff",
            padding: "10px",
          }}
        >
          <FiSettings size={28} />
        </Button>
      )}
       
      </Box>
    </main>
  );
}
