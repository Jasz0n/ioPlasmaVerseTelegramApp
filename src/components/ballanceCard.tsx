"use client";
/**
 * **BalanceCard Component**
 * --------------------------
 * **Purpose:**
 * - Displays token information (name, symbol, balance, price).
 * - Allows users to **send ERC-20 tokens** securely.
 * - Provides real-time **validation for addresses & amounts**.
 * - Displays **live transaction status**.
 *
 * **Props:**
 * @param {Token} token - The token object containing its details.
 *
 * **Features:**
 * - ✅ Address & amount validation.
 * - ✅ Prevents sending transactions with invalid data.
 * - ✅ Real-time UI feedback with status messages.
 * - ✅ Displays transaction link after confirmation.
 */
import  { FC, useState } from "react";
import {
  Text,
  TextInput,
  Loader,
  Tooltip,
  Button,
  Box,
} from "@mantine/core";
import { useActiveAccount } from "thirdweb/react";
import {  FiSend } from "react-icons/fi"; // Icon imports
import { transferFrom } from "thirdweb/extensions/erc20";
import { defineChain, getContract, isAddress, sendTransaction } from "thirdweb";
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
  token: Token;

};


export const BalanceCard: FC<INFTCardProps> = ({ token }) => {
 /* ---------------------------------------------------------------
     State Variables
  --------------------------------------------------------------- */ 
  const account = useActiveAccount();
  const [sendModalOpened, setSendModalOpened] = useState(false);
  const [amount, setAmount] = useState<string>("");
  const [toAddress, setToAddress] = useState<string>("");
  const [loading, setLoading] = useState(false);
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
     ** ✅ Validate Amount **
  --------------------------------------------------------------- */ 
    const handleAmountChange = (value: string) => {
    setAmount(value);
    const numericValue = parseFloat(value);

    if (numericValue <= 0) {
      setAmountError("Amount must be greater than zero.");
    } else if (numericValue > Number(token.balance)) {
      setAmountError("⚠️ Insufficient balance.");
    } else {
      setAmountError(null);
    }
  };

/* ---------------------------------------------------------------
     ** ✅ Handle ERC-20 Token Transfer **
  --------------------------------------------------------------- */ 
  const handleTransfer = async () => {
  if (!account) return;
  setMessage("⚠️ Please connect your wallet first.");
  setLoading(true)  
  try {
    
    setSending(true);
    setMessage("⏳ Preparing transaction...");

      const tx = await  transferFrom({
        contract: getContract({client, chain: defineChain(4689), address: token.contractAddress}),
        from: account.address,
        to: toAddress,
        amount: amount,
      })    

      setMessage("📤 Sending transaction...");

      const { transactionHash } = await sendTransaction({
        transaction:tx,
        account,
      });

      setMessage(
        `✅ Transaction Successful! 🎉 <br />
         <a href="https://www.ioPlasmaVerse.com/transactionHash/${4689}/${transactionHash}" 
            target="_blank" 
            style="color: #61dafb; text-decoration: underline;">
         View Transaction</a>`
        );
        setLoading(false)  

  } catch (err) {
    // Log detailed error information
    console.error("Error during IoTeX swap:", err);

  } finally {
    setSending(false);
    console.log("Erc20 Sending operation finished.");
  }
};
  /* ---------------------------------------------------------------
   JSX Rendering
--------------------------------------------------------------- */

return (
  <>
    {!sendModalOpened && (
      <Box
        style={{
          background: "linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))",
          backdropFilter: "blur(15px)",
          borderRadius: "15px",
          padding: "15px",
          color: "#f5f5f5",
          boxShadow: "0 10px 20px rgba(0,0,0,0.3)",
          border: "1px solid rgba(255,255,255,0.15)",
          display: "flex",
          alignItems: "center",
          height: "150px",
          justifyContent: "space-between",
        }}
      >
        {/* Token Info (Left) */}
        <Box style={{ textAlign: "left", flex: 1 }}>
          <Text size="lg" style={{ fontWeight: 700, color: "#ffffff" }}>
            {token.name} ({token.symbol})
          </Text>
          <Text size="sm" style={{ color: "#00d1b2", fontWeight: 500 }}>
            Balance: {token.balance} {token.symbol}
          </Text>
          <Text size="xs" style={{ color: "#bbb" }}>
            Price: ${token.price || "N/A"}
          </Text>
        </Box>

        {/* Token Logo (Center) */}
        <Box style={{ flexShrink: 0, textAlign: "center" }}>
          <Tooltip label={token.name} position="top" withArrow>
            {token.image ? (
              <img
                src={token.image}
                alt={`${token.name} logo`}
                width={50}
                height={50}
                style={{
                  borderRadius: "50%",
                  border: "3px solid rgba(97, 218, 251, 0.8)",
                  boxShadow: "0 0 10px rgba(97, 218, 251, 0.5)",
                  objectFit: "contain",
                }}
              />
            ) : (
              <div
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: "50%",
                  backgroundColor: "#4B5563",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  fontWeight: 600,
                  fontSize: "16px",
                }}
              >
                {token.name.charAt(0).toUpperCase()}
              </div>
            )}
          </Tooltip>
        </Box>

        {/* Send Button (Right) */}
        <Box style={{ flexShrink: 0 }}>
          <Tooltip label="Send tokens" position="top" withArrow>
            <Button
              variant="outline"
              radius="xl"
              style={{
                border: "1px solid #61dafb",
                backgroundColor: "rgba(255,255,255,0.05)",
                color: "#61dafb",
                fontSize: "14px",
                fontWeight: "bold",
                padding: "8px 14px",
                transition: "all 0.3s ease",
              }}
              onClick={() => setSendModalOpened(true)}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#61dafb")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.05)")}
            >
              <FiSend style={{ fontSize: "18px", marginRight: "5px" }} /> Send
            </Button>
          </Tooltip>
        </Box>
      </Box>
    )}

    {/* Send Modal */}
    {sendModalOpened && (
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
       
 
       <Text size="lg" style={{ fontWeight: 700, color: "#ffffff", marginBottom: "10px" }}>
         Send {token.name} ({token.symbol})
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
         label={`Amount (${token.symbol})`}
         placeholder={`Max: ${token.balance} ${token.symbol}`}
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
         ⚠️ Network fees apply. Ensure you have enough balance for gas fees.
       </Text>
 
       {/* Send Button */}
       <Button
         onClick={handleTransfer}
         disabled={sending || !!amountError || !isValidAddress}
         variant="filled"
         fullWidth
         style={{
           backgroundColor: loading ? "#444" : "#00d1b2",
           color: "#fff",
           padding: "10px",
         }}
       >
         {loading ? <Loader size="sm" /> : <FiSend style={{ marginRight: "5px" }} />}
         Send
       </Button>
         
       <Button
            onClick={() => setSendModalOpened(false)}
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
    )}
  </>
);
};