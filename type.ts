/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/elara.json`.
 */
export type Elara = {
  address: "4LhEEtzAhM6wEXJR2YQHPEs79UEx8e6HncmeHbqbW1w1";
  metadata: {
    name: "elara";
    version: "0.1.0";
    spec: "0.1.0";
    description: "Created with Anchor";
  };
  instructions: [
    {
      name: "cancelOrder";
      docs: [
        "cancel an existing order by maker or cancel when expired",
        "returns the tokens back to the maker and close the compressed escrow PDA aacount",
      ];
      discriminator: [95, 129, 237, 240, 8, 49, 223, 132];
      accounts: [
        {
          name: "payer";
          writable: true;
          signer: true;
        },
        {
          name: "maker";
          docs: [
            "The maker of the order - must be signer for non-expired orders",
            "For expired orders, anyone can cancel (including workers/keepers)",
          ];
        },
        {
          name: "inputMint";
        },
        {
          name: "outputMint";
        },
        {
          name: "makerInputMintAta";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "account";
                path: "maker";
              },
              {
                kind: "account";
                path: "inputTokenProgram";
              },
              {
                kind: "account";
                path: "inputMint";
              },
            ];
            program: {
              kind: "const";
              value: [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89,
              ];
            };
          };
        },
        {
          name: "protocolVault";
          pda: {
            seeds: [
              {
                kind: "const";
                value: [
                  112,
                  114,
                  111,
                  116,
                  111,
                  99,
                  111,
                  108,
                  95,
                  118,
                  97,
                  117,
                  108,
                  116,
                ];
              },
            ];
          };
        },
        {
          name: "protocolVaultInputMintAta";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "account";
                path: "protocolVault";
              },
              {
                kind: "account";
                path: "inputTokenProgram";
              },
              {
                kind: "account";
                path: "inputMint";
              },
            ];
            program: {
              kind: "const";
              value: [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89,
              ];
            };
          };
        },
        {
          name: "inputTokenProgram";
        },
        {
          name: "outputTokenProgram";
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        },
        {
          name: "associatedTokenProgram";
          address: "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL";
        },
      ];
      args: [
        {
          name: "args";
          type: {
            defined: {
              name: "cancelOrderParams";
            };
          };
        },
      ];
    },
    {
      name: "createAta";
      docs: [
        "To send the output tokens to the maker, maker needs to have an associated token account",
        "usallay created when initializing the order but if they close we create it",
        "take samll amount from the making amount and swap it wSOL and send it to the payer",
        "payer create the ATA",
      ];
      discriminator: [0];
      accounts: [
        {
          name: "payer";
          writable: true;
          signer: true;
        },
        {
          name: "payerWsolAta";
          docs: ["Payer’s WSOL ATA"];
          writable: true;
        },
        {
          name: "maker";
          docs: ["Maker account"];
        },
        {
          name: "makerTokenAta";
          docs: ["Maker token ATA to be created"];
          writable: true;
        },
        {
          name: "solMint";
          docs: ["SOL mint (Native Mint, fixed address)"];
          address: "So11111111111111111111111111111111111111112";
        },
        {
          name: "inputMint";
        },
        {
          name: "outputMint";
        },
        {
          name: "protocolVault";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [
                  112,
                  114,
                  111,
                  116,
                  111,
                  99,
                  111,
                  108,
                  95,
                  118,
                  97,
                  117,
                  108,
                  116,
                ];
              },
            ];
          };
        },
        {
          name: "protocolWsolAta";
          docs: ["Protocol WSOL ATA"];
          writable: true;
        },
        {
          name: "tokenProgram";
          docs: ["SPL Token program"];
          address: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
        },
        {
          name: "inputTokenProgram";
        },
        {
          name: "outputTokenProgram";
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        },
        {
          name: "associatedTokenProgram";
          address: "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL";
        },
        {
          name: "jupiterProgram";
        },
      ];
      args: [
        {
          name: "args";
          type: {
            defined: {
              name: "createTokenAccountArgs";
            };
          };
        },
      ];
    },
    {
      name: "createAtaWsol";
      docs: [
        "If the making tokens is WSOL then no need to swap",
        "take small amount from it and send it payer",
        "payer create the output ATA.",
        "update's the amount state. sub both making and taking amount",
      ];
      discriminator: [1];
      accounts: [
        {
          name: "payer";
          writable: true;
          signer: true;
        },
        {
          name: "maker";
        },
        {
          name: "solMint";
          address: "So11111111111111111111111111111111111111112";
        },
        {
          name: "outputMint";
        },
        {
          name: "makerTokenAta";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "account";
                path: "maker";
              },
              {
                kind: "account";
                path: "tokenProgram";
              },
              {
                kind: "account";
                path: "outputMint";
              },
            ];
            program: {
              kind: "const";
              value: [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89,
              ];
            };
          };
        },
        {
          name: "protocolVault";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [
                  112,
                  114,
                  111,
                  116,
                  111,
                  99,
                  111,
                  108,
                  95,
                  118,
                  97,
                  117,
                  108,
                  116,
                ];
              },
            ];
          };
        },
        {
          name: "protocolVaultInputMintAta";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "account";
                path: "protocolVault";
              },
              {
                kind: "account";
                path: "tokenProgram";
              },
              {
                kind: "account";
                path: "solMint";
              },
            ];
            program: {
              kind: "const";
              value: [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89,
              ];
            };
          };
        },
        {
          name: "payerWsolMintAta";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "account";
                path: "payer";
              },
              {
                kind: "account";
                path: "tokenProgram";
              },
              {
                kind: "account";
                path: "solMint";
              },
            ];
            program: {
              kind: "const";
              value: [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89,
              ];
            };
          };
        },
        {
          name: "tokenProgram";
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        },
        {
          name: "associatedTokenProgram";
          address: "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL";
        },
      ];
      args: [
        {
          name: "args";
          type: {
            defined: {
              name: "createTokenAccountWsolArgs";
            };
          };
        },
      ];
    },
    {
      name: "expireWsolOrder";
      docs: [
        "when the input_mint is WSOL, to unwrap it back to sol, during cancel the wsol is transferrred to maker wsol ata",
        "the maker ata can only be closed by the maker. so while expiring the order we can't unwrap",
        "since the funds are stored in a protocol vault, and can't close it. So we will create a new",
        "temporary ata owned the Program, transfer the wsol to that ata and close it with",
        "destination = maker. this will unwrap the wsol back to SOL",
        "friction less limit orders mf",
      ];
      discriminator: [28, 129, 80, 227, 153, 42, 11, 22];
      accounts: [
        {
          name: "payer";
          writable: true;
          signer: true;
        },
        {
          name: "payerWsolAta";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "account";
                path: "payer";
              },
              {
                kind: "account";
                path: "inputTokenProgram";
              },
              {
                kind: "account";
                path: "solMint";
              },
            ];
            program: {
              kind: "const";
              value: [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89,
              ];
            };
          };
        },
        {
          name: "maker";
          docs: [
            "For expired orders, anyone can cancel (including workers/keepers)",
          ];
          writable: true;
        },
        {
          name: "solMint";
          address: "So11111111111111111111111111111111111111112";
        },
        {
          name: "outputMint";
        },
        {
          name: "protocolVault";
          pda: {
            seeds: [
              {
                kind: "const";
                value: [
                  112,
                  114,
                  111,
                  116,
                  111,
                  99,
                  111,
                  108,
                  95,
                  118,
                  97,
                  117,
                  108,
                  116,
                ];
              },
            ];
          };
        },
        {
          name: "protocolVaultInputMintAta";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "account";
                path: "protocolVault";
              },
              {
                kind: "account";
                path: "inputTokenProgram";
              },
              {
                kind: "account";
                path: "solMint";
              },
            ];
            program: {
              kind: "const";
              value: [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89,
              ];
            };
          };
        },
        {
          name: "tempAccount";
          pda: {
            seeds: [
              {
                kind: "const";
                value: [116, 101, 109, 112, 95, 97, 99, 99, 111, 117, 110, 116];
              },
            ];
          };
        },
        {
          name: "tempWsolAta";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "account";
                path: "tempAccount";
              },
              {
                kind: "account";
                path: "inputTokenProgram";
              },
              {
                kind: "account";
                path: "solMint";
              },
            ];
            program: {
              kind: "const";
              value: [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89,
              ];
            };
          };
        },
        {
          name: "inputTokenProgram";
        },
        {
          name: "outputTokenProgram";
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        },
        {
          name: "associatedTokenProgram";
          address: "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL";
        },
      ];
      args: [
        {
          name: "args";
          type: {
            defined: {
              name: "cancelOrderParams";
            };
          };
        },
      ];
    },
    {
      name: "fillOrder";
      docs: [
        "fill the order when the price reaches the user target",
        "this instruction will be called a worker that is monitoring the price",
        "swap the token in vault using jupiter cpi",
        "close the light compressed escrow account",
        "transfer the output tokens to the maker",
      ];
      discriminator: [2];
      accounts: [
        {
          name: "payer";
          writable: true;
          signer: true;
        },
        {
          name: "maker";
          writable: true;
        },
        {
          name: "inputMint";
        },
        {
          name: "outputMint";
        },
        {
          name: "makerOutputMintAta";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "account";
                path: "maker";
              },
              {
                kind: "account";
                path: "outputTokenProgram";
              },
              {
                kind: "account";
                path: "outputMint";
              },
            ];
            program: {
              kind: "const";
              value: [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89,
              ];
            };
          };
        },
        {
          name: "protocolVault";
          pda: {
            seeds: [
              {
                kind: "const";
                value: [
                  112,
                  114,
                  111,
                  116,
                  111,
                  99,
                  111,
                  108,
                  95,
                  118,
                  97,
                  117,
                  108,
                  116,
                ];
              },
            ];
          };
        },
        {
          name: "protocolVaultOutputMintAta";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "account";
                path: "protocolVault";
              },
              {
                kind: "account";
                path: "outputTokenProgram";
              },
              {
                kind: "account";
                path: "outputMint";
              },
            ];
            program: {
              kind: "const";
              value: [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89,
              ];
            };
          };
        },
        {
          name: "inputTokenProgram";
        },
        {
          name: "outputTokenProgram";
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        },
        {
          name: "associatedTokenProgram";
          address: "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL";
        },
        {
          name: "jupiterProgram";
        },
      ];
      args: [
        {
          name: "args";
          type: {
            defined: {
              name: "fillOrderParams";
            };
          };
        },
      ];
    },
    {
      name: "fillWsolOrder";
      discriminator: [3];
      accounts: [
        {
          name: "payer";
          writable: true;
          signer: true;
        },
        {
          name: "payerWsolAta";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "account";
                path: "payer";
              },
              {
                kind: "account";
                path: "outputTokenProgram";
              },
              {
                kind: "account";
                path: "solMint";
              },
            ];
            program: {
              kind: "const";
              value: [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89,
              ];
            };
          };
        },
        {
          name: "maker";
          writable: true;
        },
        {
          name: "inputMint";
        },
        {
          name: "solMint";
          address: "So11111111111111111111111111111111111111112";
        },
        {
          name: "protocolVault";
          pda: {
            seeds: [
              {
                kind: "const";
                value: [
                  112,
                  114,
                  111,
                  116,
                  111,
                  99,
                  111,
                  108,
                  95,
                  118,
                  97,
                  117,
                  108,
                  116,
                ];
              },
            ];
          };
        },
        {
          name: "protocolVaultOutputMintAta";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "account";
                path: "protocolVault";
              },
              {
                kind: "account";
                path: "outputTokenProgram";
              },
              {
                kind: "account";
                path: "solMint";
              },
            ];
            program: {
              kind: "const";
              value: [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89,
              ];
            };
          };
        },
        {
          name: "tempAccount";
          pda: {
            seeds: [
              {
                kind: "const";
                value: [116, 101, 109, 112, 95, 97, 99, 99, 111, 117, 110, 116];
              },
            ];
          };
        },
        {
          name: "tempWsolAta";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "account";
                path: "tempAccount";
              },
              {
                kind: "account";
                path: "inputTokenProgram";
              },
              {
                kind: "account";
                path: "solMint";
              },
            ];
            program: {
              kind: "const";
              value: [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89,
              ];
            };
          };
        },
        {
          name: "inputTokenProgram";
        },
        {
          name: "outputTokenProgram";
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        },
        {
          name: "associatedTokenProgram";
          address: "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL";
        },
        {
          name: "jupiterProgram";
        },
      ];
      args: [
        {
          name: "args";
          type: {
            defined: {
              name: "fillOrderParams";
            };
          };
        },
      ];
    },
    {
      name: "initializeOrder";
      docs: [
        "This function creates a compressed escrow account using Light Protocol's state compression",
        "stores the order details amount, slippage and tokens",
        "Transfers the maker's input tokens to the protocol vault",
      ];
      discriminator: [133, 110, 74, 175, 112, 159, 245, 159];
      accounts: [
        {
          name: "payer";
          writable: true;
          signer: true;
        },
        {
          name: "maker";
          signer: true;
        },
        {
          name: "inputMint";
        },
        {
          name: "makerInputMintAta";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "account";
                path: "maker";
              },
              {
                kind: "account";
                path: "inputTokenProgram";
              },
              {
                kind: "account";
                path: "inputMint";
              },
            ];
            program: {
              kind: "const";
              value: [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89,
              ];
            };
          };
        },
        {
          name: "outputMint";
        },
        {
          name: "makerOutputMintAta";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "account";
                path: "maker";
              },
              {
                kind: "account";
                path: "outputTokenProgram";
              },
              {
                kind: "account";
                path: "outputMint";
              },
            ];
            program: {
              kind: "const";
              value: [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89,
              ];
            };
          };
        },
        {
          name: "protocolVault";
          pda: {
            seeds: [
              {
                kind: "const";
                value: [
                  112,
                  114,
                  111,
                  116,
                  111,
                  99,
                  111,
                  108,
                  95,
                  118,
                  97,
                  117,
                  108,
                  116,
                ];
              },
            ];
          };
        },
        {
          name: "protocolVaultInputMintAta";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "account";
                path: "protocolVault";
              },
              {
                kind: "account";
                path: "inputTokenProgram";
              },
              {
                kind: "account";
                path: "inputMint";
              },
            ];
            program: {
              kind: "const";
              value: [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89,
              ];
            };
          };
        },
        {
          name: "protocolVaultOutputMintAta";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "account";
                path: "protocolVault";
              },
              {
                kind: "account";
                path: "outputTokenProgram";
              },
              {
                kind: "account";
                path: "outputMint";
              },
            ];
            program: {
              kind: "const";
              value: [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89,
              ];
            };
          };
        },
        {
          name: "inputTokenProgram";
        },
        {
          name: "outputTokenProgram";
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        },
        {
          name: "associatedTokenProgram";
          address: "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL";
        },
      ];
      args: [
        {
          name: "initOrderArgs";
          type: {
            defined: {
              name: "initializeOrderParams";
            };
          };
        },
        {
          name: "lightArgs";
          type: {
            defined: {
              name: "lightArgs";
            };
          };
        },
      ];
    },
    {
      name: "updateOrder";
      docs: [
        "Update an existing order, change the making and taking amount",
        "change the expiry time",
        "NOTE: no need a new instruction for wsol as this is signed by the payer itself",
      ];
      discriminator: [54, 8, 208, 207, 34, 134, 239, 168];
      accounts: [
        {
          name: "payer";
          writable: true;
          signer: true;
        },
        {
          name: "maker";
          signer: true;
        },
        {
          name: "inputMint";
        },
        {
          name: "makerInputMintAta";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "account";
                path: "maker";
              },
              {
                kind: "account";
                path: "inputTokenProgram";
              },
              {
                kind: "account";
                path: "inputMint";
              },
            ];
            program: {
              kind: "const";
              value: [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89,
              ];
            };
          };
        },
        {
          name: "outputMint";
        },
        {
          name: "makerOutputMintAta";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "account";
                path: "maker";
              },
              {
                kind: "account";
                path: "outputTokenProgram";
              },
              {
                kind: "account";
                path: "outputMint";
              },
            ];
            program: {
              kind: "const";
              value: [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89,
              ];
            };
          };
        },
        {
          name: "protocolVault";
          pda: {
            seeds: [
              {
                kind: "const";
                value: [
                  112,
                  114,
                  111,
                  116,
                  111,
                  99,
                  111,
                  108,
                  95,
                  118,
                  97,
                  117,
                  108,
                  116,
                ];
              },
            ];
          };
        },
        {
          name: "protocolVaultInputMintAta";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "account";
                path: "protocolVault";
              },
              {
                kind: "account";
                path: "inputTokenProgram";
              },
              {
                kind: "account";
                path: "inputMint";
              },
            ];
            program: {
              kind: "const";
              value: [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89,
              ];
            };
          };
        },
        {
          name: "inputTokenProgram";
        },
        {
          name: "outputTokenProgram";
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        },
        {
          name: "associatedTokenProgram";
          address: "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL";
        },
      ];
      args: [
        {
          name: "args";
          type: {
            defined: {
              name: "updateOrderArgs";
            };
          };
        },
      ];
    },
  ];
  events: [
    {
      name: "fillEvent";
      discriminator: [13, 89, 41, 228, 105, 178, 45, 112];
    },
    {
      name: "orderCancelled";
      discriminator: [108, 56, 128, 68, 168, 113, 168, 239];
    },
    {
      name: "orderInitialized";
      discriminator: [180, 118, 44, 249, 166, 25, 40, 81];
    },
    {
      name: "orderUpdateEvent";
      discriminator: [74, 87, 9, 53, 182, 80, 78, 75];
    },
  ];
  errors: [
    {
      code: 6000;
      name: "invalidEscrowOwner";
      msg: "Invalid escrow owner. The owner of the esrow must be program ID";
    },
    {
      code: 6001;
      name: "unauthorized";
      msg: "Invalid signer";
    },
    {
      code: 6002;
      name: "invalidInputMint";
      msg: "invalid input mint";
    },
    {
      code: 6003;
      name: "invalidOutputMint";
      msg: "invalid output mint";
    },
    {
      code: 6004;
      name: "invalidTokenAccount";
      msg: "invalid token account passed";
    },
    {
      code: 6005;
      name: "invalidOutAmount";
      msg: "Invalid out amount need exact 2039280 lamports to create token account";
    },
    {
      code: 6006;
      name: "tokenAccountAlreadyExists";
      msg: "Token Account already exsits";
    },
    {
      code: 6007;
      name: "invalidJupInstructionData";
      msg: "Invalid instruction data from jupiter must be a exact out route or shared accounts exact out route";
    },
    {
      code: 6008;
      name: "invalidInAmount";
      msg: "Invalid in amount, must match the escrow account making amount";
    },
    {
      code: 6009;
      name: "lowTakingAmount";
      msg: "Out taking amount too low";
    },
    {
      code: 6010;
      name: "invalidEscrowMaker";
      msg: "Invalid escrow maker, must be the same as the escrow account maker";
    },
    {
      code: 6011;
      name: "slippageTooHigh";
      msg: "Slipppage too high";
    },
    {
      code: 6012;
      name: "invalidAmount";
      msg: "Invalid amount: must be greater than 0";
    },
    {
      code: 6013;
      name: "invalidSlippage";
      msg: "Invalid slippage: must be <= 10000 BPS";
    },
    {
      code: 6014;
      name: "invalidExpiration";
      msg: "Invalid expiration: must be in the future";
    },
    {
      code: 6015;
      name: "insufficientBalance";
      msg: "Insufficient balance";
    },
    {
      code: 6016;
      name: "sameMints";
      msg: "Input and output mints cannot be the same";
    },
    {
      code: 6017;
      name: "invalidMint";
      msg: "Invalid mint configuration";
    },
    {
      code: 6018;
      name: "orderAlreadyExists";
      msg: "Order already exists";
    },
    {
      code: 6019;
      name: "amountTooLarge";
      msg: "Amount too large for safe calculations";
    },
    {
      code: 6020;
      name: "mathOverflow";
      msg: "Math overflow";
    },
    {
      code: 6021;
      name: "invalidEscrow";
      msg: "Invalid escrow address";
    },
    {
      code: 6022;
      name: "invalidPlatformFeeBps";
      msg: "Invalid platform fee bps should be either 5 or 0";
    },
    {
      code: 6023;
      name: "invalidCreateAtaInstruction";
      msg: "Invalid instruction to create ata when the making token is SOL call create_ata_wsol instruction";
    },
    {
      code: 6024;
      name: "invalidTokenProgramId";
      msg: "invalidTokenProgramId";
    },
    {
      code: 6025;
      name: "invalidAccount";
      msg: "Invalid Account";
    },
    {
      code: 6026;
      name: "notWritable";
      msg: "Account not writable";
    },
    {
      code: 6027;
      name: "invalidNumberOfAccounts";
      msg: "Invalid number of Accounts";
    },
    {
      code: 6028;
      name: "solAtaCreatedSeparately";
      msg: "Taking account SOL ata is created separately";
    },
    {
      code: 6029;
      name: "orderNotExpired";
      msg: "Order not expired";
    },
    {
      code: 6030;
      name: "expireWSolInstruction";
      msg: "Call ExpireWSol Instruction";
    },
  ];
  types: [
    {
      name: "accountParams";
      type: {
        kind: "struct";
        fields: [
          {
            name: "uniqueId";
            type: "u64";
          },
          {
            name: "amount";
            type: {
              defined: {
                name: "amount";
              };
            };
          },
          {
            name: "feeBps";
            type: "u16";
          },
          {
            name: "expiredAt";
            type: "i64";
          },
          {
            name: "createdAt";
            type: "i64";
          },
          {
            name: "updatedAt";
            type: "i64";
          },
        ];
      };
    },
    {
      name: "amount";
      type: {
        kind: "struct";
        fields: [
          {
            name: "oriMakingAmount";
            type: "u64";
          },
          {
            name: "oriTakingAmount";
            type: "u64";
          },
          {
            name: "makingAmount";
            type: "u64";
          },
          {
            name: "takingAmount";
            type: "u64";
          },
        ];
      };
    },
    {
      name: "cancelOrderParams";
      type: {
        kind: "struct";
        fields: [
          {
            name: "escrowAccount";
            type: {
              defined: {
                name: "accountParams";
              };
            };
          },
          {
            name: "proof";
            type: {
              defined: {
                name: "validityProof";
              };
            };
          },
          {
            name: "treeInfo";
            type: {
              defined: {
                name: "packedStateTreeInfo";
              };
            };
          },
          {
            name: "outputStateTreeIndex";
            type: "u8";
          },
        ];
      };
    },
    {
      name: "compressedAccountMeta";
      type: {
        kind: "struct";
        fields: [
          {
            name: "treeInfo";
            docs: ["Merkle tree context."];
            type: {
              defined: {
                name: "packedStateTreeInfo";
              };
            };
          },
          {
            name: "address";
            docs: ["Address."];
            type: {
              array: ["u8", 32];
            };
          },
          {
            name: "outputStateTreeIndex";
            docs: ["Output merkle tree index."];
            type: "u8";
          },
        ];
      };
    },
    {
      name: "compressedProof";
      repr: {
        kind: "c";
      };
      type: {
        kind: "struct";
        fields: [
          {
            name: "a";
            type: {
              array: ["u8", 32];
            };
          },
          {
            name: "b";
            type: {
              array: ["u8", 64];
            };
          },
          {
            name: "c";
            type: {
              array: ["u8", 32];
            };
          },
        ];
      };
    },
    {
      name: "createTokenAccountArgs";
      type: {
        kind: "struct";
        fields: [
          {
            name: "swapData";
            type: "bytes";
          },
          {
            name: "takingAmount";
            type: "u64";
          },
          {
            name: "escrowAccount";
            type: {
              defined: {
                name: "accountParams";
              };
            };
          },
          {
            name: "proof";
            type: {
              defined: {
                name: "validityProof";
              };
            };
          },
          {
            name: "treeInfo";
            type: {
              defined: {
                name: "packedStateTreeInfo";
              };
            };
          },
          {
            name: "outputStateTreeIndex";
            type: "u8";
          },
        ];
      };
    },
    {
      name: "createTokenAccountWsolArgs";
      type: {
        kind: "struct";
        fields: [
          {
            name: "swapData";
            type: "bytes";
          },
          {
            name: "escrowAccount";
            type: {
              defined: {
                name: "escrowAccount";
              };
            };
          },
          {
            name: "proof";
            type: {
              defined: {
                name: "validityProof";
              };
            };
          },
          {
            name: "accountMeta";
            type: {
              defined: {
                name: "compressedAccountMeta";
              };
            };
          },
        ];
      };
    },
    {
      name: "escrowAccount";
      type: {
        kind: "struct";
        fields: [
          {
            name: "maker";
            type: "pubkey";
          },
          {
            name: "uniqueId";
            type: "u64";
          },
          {
            name: "tokens";
            type: {
              defined: {
                name: "tokens";
              };
            };
          },
          {
            name: "amount";
            type: {
              defined: {
                name: "amount";
              };
            };
          },
          {
            name: "expiredAt";
            type: "i64";
          },
          {
            name: "createdAt";
            type: "i64";
          },
          {
            name: "updatedAt";
            type: "i64";
          },
          {
            name: "feeBps";
            type: "u16";
          },
        ];
      };
    },
    {
      name: "fillEvent";
      type: {
        kind: "struct";
        fields: [
          {
            name: "escrowAddress";
            type: "pubkey";
          },
          {
            name: "maker";
            type: "pubkey";
          },
          {
            name: "inputMint";
            type: "pubkey";
          },
          {
            name: "outputMint";
            type: "pubkey";
          },
          {
            name: "uniqueId";
            type: "u64";
          },
          {
            name: "inAmount";
            type: "u64";
          },
          {
            name: "outAmount";
            type: "u64";
          },
          {
            name: "feeBps";
            type: "u16";
          },
          {
            name: "fillType";
            type: {
              defined: {
                name: "fillType";
              };
            };
          },
        ];
      };
    },
    {
      name: "fillOrderParams";
      type: {
        kind: "struct";
        fields: [
          {
            name: "swapData";
            type: "bytes";
          },
          {
            name: "escrowAccount";
            type: {
              defined: {
                name: "accountParams";
              };
            };
          },
          {
            name: "proof";
            type: {
              defined: {
                name: "validityProof";
              };
            };
          },
          {
            name: "treeInfo";
            type: {
              defined: {
                name: "packedStateTreeInfo";
              };
            };
          },
          {
            name: "outputStateTreeIndex";
            type: "u8";
          },
          {
            name: "fillType";
            type: {
              defined: {
                name: "fillType";
              };
            };
          },
        ];
      };
    },
    {
      name: "fillType";
      type: {
        kind: "enum";
        variants: [
          {
            name: "full";
          },
          {
            name: "partial";
          },
        ];
      };
    },
    {
      name: "initializeOrderParams";
      type: {
        kind: "struct";
        fields: [
          {
            name: "uniqueId";
            type: "u64";
          },
          {
            name: "makingAmount";
            type: "u64";
          },
          {
            name: "takingAmount";
            type: "u64";
          },
          {
            name: "expiredAt";
            type: {
              option: "i64";
            };
          },
        ];
      };
    },
    {
      name: "lightArgs";
      type: {
        kind: "struct";
        fields: [
          {
            name: "proof";
            type: {
              defined: {
                name: "validityProof";
              };
            };
          },
          {
            name: "addressTreeInfo";
            type: {
              defined: {
                name: "packedAddressTreeInfo";
              };
            };
          },
          {
            name: "outputStateTreeIndex";
            type: "u8";
          },
        ];
      };
    },
    {
      name: "orderCancelled";
      type: {
        kind: "struct";
        fields: [
          {
            name: "escrowAddress";
            type: "pubkey";
          },
          {
            name: "maker";
            type: "pubkey";
          },
          {
            name: "uniqueId";
            type: "u64";
          },
          {
            name: "inputMint";
            type: "pubkey";
          },
          {
            name: "outputMint";
            type: "pubkey";
          },
          {
            name: "makingAmount";
            type: "u64";
          },
          {
            name: "takingAmount";
            type: "u64";
          },
          {
            name: "isExpired";
            type: "bool";
          },
          {
            name: "cancelledBy";
            type: "pubkey";
          },
          {
            name: "timestamp";
            type: "i64";
          },
        ];
      };
    },
    {
      name: "orderInitialized";
      type: {
        kind: "struct";
        fields: [
          {
            name: "escrowAddress";
            type: "pubkey";
          },
          {
            name: "maker";
            type: "pubkey";
          },
          {
            name: "uniqueId";
            type: "u64";
          },
          {
            name: "inputMint";
            type: "pubkey";
          },
          {
            name: "outputMint";
            type: "pubkey";
          },
          {
            name: "inputMintDecimals";
            type: "u8";
          },
          {
            name: "outputMintDecimals";
            type: "u8";
          },
          {
            name: "makingAmount";
            type: "u64";
          },
          {
            name: "takingAmount";
            type: "u64";
          },
          {
            name: "expiredAt";
            type: "i64";
          },
        ];
      };
    },
    {
      name: "orderUpdateEvent";
      type: {
        kind: "struct";
        fields: [
          {
            name: "escrowAddress";
            type: "pubkey";
          },
          {
            name: "maker";
            type: "pubkey";
          },
          {
            name: "uniqueId";
            type: "u64";
          },
          {
            name: "inputMint";
            type: "pubkey";
          },
          {
            name: "outputMint";
            type: "pubkey";
          },
          {
            name: "inputMintDecimals";
            type: "u8";
          },
          {
            name: "outputMintDecimals";
            type: "u8";
          },
          {
            name: "makingAmount";
            type: "u64";
          },
          {
            name: "takingAmount";
            type: "u64";
          },
          {
            name: "expiredAt";
            type: "i64";
          },
        ];
      };
    },
    {
      name: "packedAddressTreeInfo";
      type: {
        kind: "struct";
        fields: [
          {
            name: "addressMerkleTreePubkeyIndex";
            type: "u8";
          },
          {
            name: "addressQueuePubkeyIndex";
            type: "u8";
          },
          {
            name: "rootIndex";
            type: "u16";
          },
        ];
      };
    },
    {
      name: "packedStateTreeInfo";
      type: {
        kind: "struct";
        fields: [
          {
            name: "rootIndex";
            type: "u16";
          },
          {
            name: "proveByIndex";
            type: "bool";
          },
          {
            name: "merkleTreePubkeyIndex";
            type: "u8";
          },
          {
            name: "queuePubkeyIndex";
            type: "u8";
          },
          {
            name: "leafIndex";
            type: "u32";
          },
        ];
      };
    },
    {
      name: "tokens";
      type: {
        kind: "struct";
        fields: [
          {
            name: "inputMint";
            type: "pubkey";
          },
          {
            name: "outputMint";
            type: "pubkey";
          },
          {
            name: "inputTokenProgram";
            type: "pubkey";
          },
          {
            name: "outputTokenProgram";
            type: "pubkey";
          },
        ];
      };
    },
    {
      name: "updateOrderArgs";
      type: {
        kind: "struct";
        fields: [
          {
            name: "escrowAccount";
            type: {
              defined: {
                name: "accountParams";
              };
            };
          },
          {
            name: "proof";
            type: {
              defined: {
                name: "validityProof";
              };
            };
          },
          {
            name: "treeInfo";
            type: {
              defined: {
                name: "packedStateTreeInfo";
              };
            };
          },
          {
            name: "outputStateTreeIndex";
            type: "u8";
          },
          {
            name: "makingAmount";
            type: {
              option: "u64";
            };
          },
          {
            name: "takingAmount";
            type: {
              option: "u64";
            };
          },
          {
            name: "expiredAt";
            type: {
              option: "i64";
            };
          },
        ];
      };
    },
    {
      name: "validityProof";
      type: {
        kind: "struct";
        fields: [
          {
            option: {
              defined: {
                name: "compressedProof";
              };
            };
          },
        ];
      };
    },
  ];
  constants: [
    {
      name: "ataCreationAmount";
      type: "u64";
      value: "2039280";
    },
    {
      name: "protocolVault";
      type: "pubkey";
      value: "HmTYE1huZakHZn9VwSR6p6mBjGFT8hJUCRC4aWuCCSnd";
    },
    {
      name: "protocolVaultBump";
      type: "u8";
      value: "254";
    },
    {
      name: "protocolVaultSeed";
      type: "bytes";
      value: "[112, 114, 111, 116, 111, 99, 111, 108, 95, 118, 97, 117, 108, 116]";
    },
    {
      name: "solMint";
      type: "pubkey";
      value: "So11111111111111111111111111111111111111112";
    },
  ];
};
