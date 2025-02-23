/**
 * **SwapInput Component**
 * -----------------------------------
 * **Purpose:**
 * - Provides an input field for users to enter **token swap amounts**.
 * - Allows users to **select a token** from a list.
 *
 * **Props:**
 * @param {"native" | "token"} type - Determines whether the input is for a native token or an ERC-20 token.
 * @param {Token} selectedToken - The currently selected token.
 * @param {Function} setValue - Function to update the entered amount.
 * @param {string} [max] - Optional maximum allowable value for input.
 * @param {string} value - The amount input by the user.
 * @param {Token[]} tokenList - The list of available tokens for selection.
 * @param {Function} setDropdownOpen - Function to open the token selection dropdown.
 * @param {Function} onSelectToken - Function to handle token selection.
 *
 * **Features:**
 * - ✅ Supports both **native tokens** and **ERC-20 tokens**.
 * - ✅ Ensures **clean UI with left-aligned input and right-aligned selection button**.
 * - ✅ **Updates value dynamically** as the user types.
 * - ✅ Provides a **visual indication of selected token**.
 */

import {  Box, Input, Paper, Text } from "@mantine/core";


type Token = {
  name: string;
  symbol: string;
  contractAddress: string;
  image: string;
  balance?: string; 
  coinCecko?: string;
  hasTax?: boolean;
  decimals: number;
};


  
  type Props = {
    type: "native" | "token";
    selectedToken: Token;
    setValue: (value: string) => void;
    max?: string;
    value: string;
    tokenList: Token[];
    setDropdownOpen: (type: "native" | "token") => void;
    onSelectToken: (token: Token) => void; // ✅ Add this line
  };

  export default function SwapInput({
    type,
    selectedToken,
    setDropdownOpen,
    setValue,
    value,
    max,
  }: Props) {
      

    
  /* ---------------------------------------------------------------
   JSX Rendering
--------------------------------------------------------------- */ 


    return (
      <Box style={{ marginBottom: "1.5rem", width: "98%" }}>
        {/* Label */}
        <Text size="sm" style={{ fontWeight: 600, marginBottom: "0.5rem", color: "#f5f5f5" }}>
          {selectedToken?.symbol} {type === "native" ? "You Pay" : "You Receive"}
        </Text>
  
        <Paper
          withBorder
          shadow="sm"
          radius="lg"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between", // ✅ Ensures left & right alignment
            backgroundColor: "rgba(255, 255, 255, 0.05)",
            color: "white",
            width: "98%",
            border: "1px solid #61dafb",
            borderRadius: "12px",
            padding: "10px 15px",
          }}
        >
          {/* Input Field (Left-Aligned) */}
          <Input
            type="number"
            value={value}
            placeholder="0.0"
            onChange={(e) => setValue(e.target.value)}
            styles={{
              input: {
                fontSize: "1.4rem",
                fontWeight: 500,
                color: "white",
                background: "transparent",
                border: "none",
                outline: "none",
                width: "100%", 
                textAlign: "left", 
              },
            }}
          />
  
          {/* Token Select Button (Fully Right-Aligned) */}
          <Box
            style={{
              display: "flex",
              alignItems: "center",
              cursor: "pointer",
              width: "110px",
              padding: "5px 10px",
              borderRadius: "8px",
              border: "1px solid #61dafb",
              backgroundColor: "rgba(255, 255, 255, 0.1)",
              transition: "background-color 0.3s",
              flexShrink: 0, // ✅ Ensures it doesn't affect input field width
            }}
            onClick={() => setDropdownOpen(type)}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(97, 218, 251, 0.3)")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.1)")}
          >
            <img
              src={selectedToken?.image}
              alt={selectedToken?.symbol}
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                marginRight: "13px", 
              }}
            />
            <Text size="sm" style={{ fontWeight: 600 }}>
              {selectedToken?.symbol || "Select"}
            </Text>
          </Box>
        </Paper>
      </Box>
    );
  };