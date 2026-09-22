# Unit 05: Blockchain Integration

## Goal

Connect the application to the deployed Solidity contract on a local Hardhat network first, with Sepolia support as the final testnet target.

## Implementation

Create a blockchain service that:
- Loads contract ABI/address from configuration.
- Creates health-record transactions.
- Reads health records.
- Reads/writes consent.
- Reads/calculates premium.
- Reads/writes claim state.
- Reads reward points.

Use environment variables for:
- RPC URL
- contract address
- wallet private key when backend signing is used

Never commit `.env`.

## Verify when done

- [ ] Local blockchain integration works.
- [ ] Contract address is configurable.
- [ ] Health hash can be written and read.
- [ ] Consent can be written and read.
- [ ] `.env` is ignored by git.
- [ ] Sepolia configuration is documented but does not require paid infrastructure.
