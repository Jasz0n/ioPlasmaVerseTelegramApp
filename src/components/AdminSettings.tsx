  "use client";
  /**
 * **AdminDashboard Component**
 * --------------------------------
 * **Features:**
 * - **Group Registration** for Telegram-based Web3 communities.
 * - **Group Settings Management** (Only available to **Admins & Founders**).
 * - **Wallet Connection** using **thirdweb/react**.
 * - **Checks Group Existence** and allows updates to **Marketplace & NFT settings**.
 * 
 * @returns {JSX.Element} Admin interface for managing Web3 Telegram groups.
 * 
 * 📌 Author: [Jason]
 * 📌 Last Updated: [22-2-2025]
 */
  import { useCallback, useEffect, useState } from "react";
  import { useActiveAccount } from "thirdweb/react"; 
  import { Box, Button, TextInput, Text } from "@mantine/core";
  import { useRouter,useSearchParams } from "next/navigation"; 

  export default function AdminDashboard() {
     /* ---------------------------------------------------------------
     State Variables
  --------------------------------------------------------------- */

    const account = useActiveAccount(); 
    const [groupExists, setGroupExists] = useState(false);
    const [groupData, setGroupData] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [params, setParams] = useState({ userId: "", groupId: "", isAdmin: false, isFounder: false });
     /* ---------------------------------------------------------------
      ** ✅ **Extract & Set Query Params from URL** 
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
      ** ✅ **Registers the Telegram Group for Web3 Features**
  --------------------------------------------------------------- */
    const registerGroup = async () => {
      if (!params.isFounder) {
        setError("❌ Only the group owner can activate the bot.");
        return;
      }

      if (!params.userId || !params.groupId || !account?.address) {
        setError("❌ Missing userId, groupId, or connected wallet.");
        return;
      }

      setLoading(true);
      setError("");

      try {
        const res = await fetch("https://www.ioplasmaverse.com/api/groups/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId:params.userId,
            groupId: params.groupId,
            walletAddress: account.address,
          }),
        });

        if (res.ok) {
          setGroupExists(true);
          const newData = await res.json();
          setGroupData(newData);
        } else {
          const errorData = await res.json();
          setError(errorData.error || "Failed to register group.");
        }
      } catch (err) {
        setError("Error registering group");
      } finally {
        setLoading(false);
      }
    };

     /* ---------------------------------------------------------------
      ** ✅ **Updates Group Settings (Admins & Founders Only)**
  --------------------------------------------------------------- */

    const updateSettings = async () => {
      if (!groupData) return;
    
      if (!params.isAdmin && !params.isFounder) {
        alert("❌ Only admins or the group owner can update settings.");
        return;
      }
    
      console.log("🔹 Sending Updated Group Data:", groupData); // ✅ Log data before sending
    
      try {
        const res = await fetch("https://www.ioplasmaverse.com/api/groups/update", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            groupId: params.groupId,
            walletAddress: account?.address, // Ensure wallet is passed
            chainId: groupData.chainId,
            marketplaceAddress: groupData.marketplaceAddress,
            collectionAddress: groupData.collectionAddress,
            erc20Address: groupData.erc20Address,
            feeReceiver: groupData.feeReceiver,
          }),
        });
    
        const responseData = await res.json(); // ✅ Log the response
        console.log("🔹 API Response:", responseData);
    
        if (!res.ok) throw new Error(responseData.error || "Failed to update settings");
    
        alert("✅ Settings updated successfully!");
      } catch (err) {
        console.error("❌ Error updating settings:", err);
        alert("❌ Error updating settings");
      }
    };

     /* ---------------------------------------------------------------
      ** ✅ **Checks if the Group Exists in the Database**
  --------------------------------------------------------------- */

    const checkGroupExists = useCallback(async () => {
      setLoading(true);
      setError("");
    
      try {
        const res = await fetch(`https://www.ioplasmaverse.com/api/groups/${params.groupId}`);
        const data = await res.json();
    
        if (res.ok) {
          setGroupExists(true);
          setGroupData(data);
        } else {
          setGroupExists(false);
        }
      } catch (err) {
        setError("Error checking group");
      } finally {
        setLoading(false);
      }
    }, [params.groupId]); 

     /* ---------------------------------------------------------------
      ** ✅ **Check Group Existence on Component Load**
  --------------------------------------------------------------- */
    
    useEffect(() => {
      if (params.groupId) {
        checkGroupExists();
      }
    }, [params.groupId, checkGroupExists]);
    /* ---------------------------------------------------------------
   JSX Rendering
--------------------------------------------------------------- */

    return (
      <Box style={{ flexDirection: "column", alignItems: "center", width: "100%", height: "100vh", padding: "20px" }}>
        <h1>Admin Dashboard</h1>

        {/* ✅ Show Telegram User Data */}
        <Text>👤 Telegram User ID: {params.userId}</Text>
        <Text>📢 Group ID: {params.groupId || "Not detected"}</Text>
        <Text>🔗 Wallet: {account?.address || "Not connected"}</Text>
        <Text>👑 Role: {params.isFounder ? "Founder (Owner)" : params.isAdmin ? "Admin" : "Member"}</Text>

        {loading && <Text>Loading...</Text>}
        {error && <Text color="red">{error}</Text>}

        {!groupExists ? (
          <Button onClick={registerGroup} disabled={!params.isFounder || !account?.address}>
            🚀 Activate Group (Founder Only)
          </Button>
        ) : (
          <>
            {/* ✅ Show & Edit Group Settings (Only Admins & Founders) */}
            <Text>✅ Group Registered</Text>

            <TextInput
              label="Blockchain Chain ID"
              type="number"
              value={groupData?.chainId || ""}
              onChange={(e) => setGroupData({ ...groupData, chainId: parseInt(e.target.value) })}
              disabled={!params.isAdmin && !params.isFounder}
            />
            <TextInput
              label="NFT Marketplace Address"
              value={groupData?.marketplaceAddress || ""}
              onChange={(e) => setGroupData({ ...groupData, marketplaceAddress: e.target.value })}
              disabled={!params.isAdmin && !params.isFounder}
            />
            <TextInput
              label="NFT Collection Address"
              value={groupData?.collectionAddress || ""}
              onChange={(e) => setGroupData({ ...groupData, collectionAddress: e.target.value })}
              disabled={!params.isAdmin && !params.isFounder}
            />
            <TextInput
              label="ERC-20 Token Address"
              value={groupData?.erc20Address || ""}
              onChange={(e) => setGroupData({ ...groupData, erc20Address: e.target.value })}
              disabled={!params.isAdmin && !params.isFounder}
            />
            <TextInput
              label="Fee Receiver"
              value={groupData?.feeReceiver || ""}
              onChange={(e) => setGroupData({ ...groupData, feeReceiver: e.target.value })}
              disabled={!params.isAdmin && !params.isFounder}
            />

            <Button onClick={updateSettings} 
              disabled={!params.isAdmin && !params.isFounder}
              >
              💾 Save Settings
            </Button>
          </>
        )}
      </Box>
    );
  }
