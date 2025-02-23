"use client";

import { useState } from "react";
import { TransactionButton } from "thirdweb/react";
import { approve } from "thirdweb/extensions/erc20";
import { defineChain, getContract } from "thirdweb";
import { client } from "@/app/constants";

/**
 * **ApprovalButtonERC20 Component**
 * --------------------------------
 * **Purpose:** 
 * - Allows users to approve ERC-20 tokens for spending on a Web3 marketplace.
 * - Displays real-time transaction status updates.
 * - Prevents duplicate approval requests using a loading state.
 * 
 * **Props:**
 * @param {string} amount - The amount of ERC-20 tokens to approve.
 * @param {string} currencyContractAddress - The contract address of the ERC-20 token.
 * @param {() => void} onApproved - Callback function triggered after successful approval.
 * 
 * **Features:**
 * - ✅ Prevents duplicate approvals.
 * - ✅ Provides real-time transaction updates.
 * - ✅ Displays clickable transaction link after confirmation.
 * - ✅ Handles errors gracefully.
 * 
 * @returns {JSX.Element} Approval button for ERC-20 tokens.
 */
export default function ApprovalButtonERC20({
  amount,
  currencyContractAddress,
  onApproved,
}: {
  amount: string;
  currencyContractAddress: string;
  onApproved: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  /** ✅ Marketplace Contract Address */
  const MARKETPLACE_ADDRESS = "0xF87c2066577f2e1c799C4e5628d578B623F5481f";

  /** ✅ Initialize Marketplace Contract */
  const MARKETPLACE = getContract({
    address: MARKETPLACE_ADDRESS,
    client,
    chain: defineChain(4689), // IoTeX Chain ID
  });

  /** ✅ Initialize ERC-20 Contract */
  const ioShiba = getContract({
    address: currencyContractAddress,
    client,
    chain: defineChain(4689),
  });

  /** ✅ Handle Token Approval */
  const handleApproval = async () => {
    try {
      setLoading(true);
      setMessage("⏳ Approving ERC20 token...");

      console.log("🔹 Spender (Marketplace):", MARKETPLACE.address);
      console.log("🔹 Amount:", amount);

      /** ✅ Execute ERC-20 Approval Transaction */
      const transaction = await approve({
        contract: ioShiba,
        spender: MARKETPLACE_ADDRESS,
        amount,
      });

      console.log("🔹 Transaction prepared:", transaction);
      return transaction;
    } catch (error) {
      setLoading(false);
      setMessage("❌ Approval failed. Please try again.");
      console.error("❌ Error in preparing transaction:", error);
      throw error;
    }
  };

     /* ---------------------------------------------------------------
   Transaction Button Rendering
  --------------------------------------------------------------- */
  return (
    <>
      {/* ✅ Approve Button (Disabled while Loading) */}
      <TransactionButton
        disabled={loading}
        transaction={handleApproval}
        onTransactionSent={() => {
          setMessage("📤 Transaction sent. Waiting for confirmation...");
        }}
        onError={(error) => {
          setLoading(false);
          setMessage("❌ Approval failed. Please try again.");
          console.error("❌ Approval Failed:", error);
        }}
        onTransactionConfirmed={(txResult) => {
          setLoading(false);
          setMessage(
            `✅ Approval successful! 🎉 <br />
            <a href="https://www.ioPlasmaVerse.com/transactionHash/4689/${txResult.transactionHash}" 
               target="_blank" 
               style="color: #61dafb; text-decoration: underline;">
            View Transaction</a>`
          );
          onApproved();
        }}
      >
        {loading ? "Approving..." : "Approve Shiba"}
      </TransactionButton>

      {/* ✅ Display Transaction Status Message */}
      {message && (
        <div 
          style={{
            marginTop: "10px",
            padding: "8px",
            background: "#222",
            color: "#fff",
            borderRadius: "5px",
            textAlign: "center",
          }}
          dangerouslySetInnerHTML={{ __html: message }} // ✅ Allows clickable transaction links
        />
      )}
    </>
  );
}
