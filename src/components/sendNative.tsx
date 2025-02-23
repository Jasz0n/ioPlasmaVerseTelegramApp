"use client";
/**
 * **SendNative Component**
 * -----------------------------------
 * **Purpose:**
 * - Enables users to **send native tokens** (or any other native blockchain token) to another address.
 * - Handles **wallet address validation** and **amount validation** before processing the transaction.
 *
 * **Props:**
 * @param {string} title - The title of the balance modal.
 * @param {string} balance - The available native token balance of the user.
 * @param {string} name - The name of the native token.
 * @param {string} symbol - The symbol of the native token (e.g., IOTX).
 * @param {number} chainId - The blockchain network ID.
 * @param {Token} WETH - The wrapped native token details.
 * @param {Function} setBalanceModalOpen - Function to toggle the balance modal.
 *
 * **Features:**
 * - ✅ Allows users to **send native tokens** to a valid wallet address.
 * - ✅ Ensures **address validation** before allowing transactions.
 * - ✅ Handles **gas fee considerations** and **balance checks**.
 * - ✅ Provides **real-time transaction feedback** to the user.
 */
import  { FC, useState } from "react";
import {
  Text,
  TextInput,
  Button,
  Box,
  Loader,
} from "@mantine/core";
import { useActiveAccount } from "thirdweb/react";
import {
  FiSend,
} from "react-icons/fi"; 
import { defineChain, isAddress, prepareTransaction, sendTransaction, toWei } from "thirdweb";
import { client } from "@/app/constants";





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
  setBalanceModalOpen: () => void; // ✅ This should be a function that takes a boolean
};

export const SendNative: FC<INFTCardProps> = ({
  title,
  balance,
  chainId,
  WETH,
  setBalanceModalOpen
}) => {
   /* ---------------------------------------------------------------
     State Variables
  --------------------------------------------------------------- */ 
  const account = useActiveAccount();
  const [amount, setAmount] = useState<string>("");
  const [toAddress, setToAddress] = useState<string>("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);


  const [isValidAddress, setIsValidAddress] = useState<boolean>(false);
  const [amountError, setAmountError] = useState<string | null>(null);

 /* ---------------------------------------------------------------
     ** ✅ Validate Crypto Wallet Address **
  --------------------------------------------------------------- */ 
  
  const handleAddressChange = (value: string) => {
    setToAddress(value);
    if (isAddress(value)) {
      setIsValidAddress(true);
      setMessage("");
    } else {
      setIsValidAddress(false);
      setMessage("⚠️ Invalid wallet address.");
    }
  };

 /* ---------------------------------------------------------------
     ** ✅ Validate Transaction Amount **
  --------------------------------------------------------------- */ 
    const handleAmountChange = (value: string) => {
    setAmount(value);
    const numericValue = parseFloat(value);

    if (numericValue <= 0) {
      setAmountError("Amount must be greater than zero.");
    } else if (numericValue > Number(balance)) {
      setAmountError("⚠️ Insufficient balance.");
    } else {
      setAmountError(null);
    }
  };


   
 /* ---------------------------------------------------------------
     ** ✅ Handle Native Token Transfer **
  --------------------------------------------------------------- */ 
const handleTransfer = async () => {
  if (!account) {
    setMessage("⚠️ Please connect your wallet first.");
    return;
  }

  try {
    setSending(true);
    setMessage("⏳ Preparing transaction...");

    // Step 1: Prepare transaction
    const tx = await prepareTransaction({
      to: toAddress,
      chain: defineChain(chainId),
      client: client,
      value: toWei(amount),
    });

    setMessage("📤 Sending transaction...");

    // Step 2: Send transaction
    const transaction = await sendTransaction({
      transaction: tx,
      account,
    });

    console.log("Transaction Sent:", transaction);

    // Step 3: Show success message with clickable transaction link
    setMessage(
      `✅ Transaction Successful! 🎉 <br />
       <a href="https://www.ioPlasmaVerse.com/transactionHash/${chainId}/${transaction.transactionHash}" 
          target="_blank" 
          style="color: #61dafb; text-decoration: underline;">
       View Transaction</a>`
    );
  } catch (err) {
    console.error("❌ Error during IoTeX swap:", err);
    setMessage("❌ Transaction failed. Please try again.");
  } finally {
    setSending(false);
    console.log("IoTeX swap operation finished.");
  }
};



 /* ---------------------------------------------------------------
   JSX Rendering
--------------------------------------------------------------- */ 

return (
           <Box
           style={{
             background: "rgba(255, 255, 255, 0.08)",
             backdropFilter: "blur(15px)",
             borderRadius: "12px",
             color: "#f5f5f5",
             border: "1px solid rgba(97, 218, 251, 0.3)",
             width: "100%",
             textAlign: "center",
           }}
         >
           {/* Back Button */}
           <Button
                onClick={() => setBalanceModalOpen()}
                variant="subtle"
             style={{
               background: "transparent",
               color: "#61dafb",
               fontSize: "16px",
               fontWeight: "bold",
               cursor: "pointer",
               marginBottom: "15px",
             }}
           >
             ⬅ Back
           </Button>
     
           <Text size="lg" style={{ fontWeight: 700, color: "#ffffff", marginBottom: "10px" }}>
             Send {WETH.name} ({WETH.symbol})
           </Text>
     
           {/* Wallet Address Input */}
           <TextInput
             label="Recipient Wallet Address"
             placeholder="Enter recipient address"
             value={toAddress}
             onChange={(e) => handleAddressChange(e.target.value)}
             required
             styles={{
               input: {
                 backgroundColor: "rgba(255,255,255,0.1)",
                 border: isValidAddress ? "1px solid green" : "1px solid red",
                 color: "#f5f5f5",
                 padding: "10px",
               },
             }}
             mb="md"
           />
           {message && (
             <Text size="xs" color="red" style={{ marginTop: "-8px", marginBottom: "10px" }}>
               {message}
             </Text>
           )}
     
           {/* Amount Input */}
           <TextInput
             label={`Amount (${WETH.symbol})`}
             placeholder={`Max: ${WETH.balance} ${WETH.symbol}`}
             value={amount}
             onChange={(e) => handleAmountChange(e.target.value)}
             required
             styles={{
               input: {
                 backgroundColor: "rgba(255,255,255,0.1)",
                 border: amountError ? "1px solid red" : "1px solid green",
                 color: "#f5f5f5",
                 padding: "10px",
               },
             }}
             mb="md"
           />
           {amountError && (
             <Text size="xs" color="red" style={{ marginTop: "-8px", marginBottom: "10px" }}>
               {amountError}
             </Text>
           )}
     
           {/* Fee Information */}
           <Text size="xs" style={{ color: "#bbb", marginTop: "10px", marginBottom: "10px" }}>
             ⚠️ Network fees apply. Ensure you have enough balance for gas fees on {title}.
           </Text>
     
           {/* Send Button */}
           <Button
             onClick={handleTransfer}
             disabled={sending || !!amountError || !isValidAddress}
             variant="filled"
             fullWidth
             style={{
               backgroundColor: sending ? "#444" : "#00d1b2",
               color: "#fff",
               padding: "10px",
             }}
           >
             {sending ? <Loader size="sm" /> : <FiSend style={{ marginRight: "5px" }} />}
             Send
           </Button>
     
           {/* Transaction Status */}
           {message && (
            <Box
                style={{
                marginTop: "10px",
                padding: "8px",
                background: "#222",
                color: "#fff",
                borderRadius: "5px",
                textAlign: "center",
                }}
                dangerouslySetInnerHTML={{ __html: message }} // ✅ Allows clickable links
            />
            )}

            
            </Box>
);
};


