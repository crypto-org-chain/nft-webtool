import { Bech32Address } from "@keplr-wallet/cosmos";
import { ChainInfo } from "@keplr-wallet/types";
import { AxiosRequestConfig } from "axios";

const CRYPTO_ORG_RPC_ENDPOINT = "https://testnet-croeseid-3.crypto.org:26657";
const CRYPTO_ORG_RPC_CONFIG: AxiosRequestConfig | undefined = undefined;
const CRYPTO_ORG_REST_ENDPOINT = "https://testnet-croeseid-3.crypto.org:1317";
const CRYPTO_ORG_REST_CONFIG: AxiosRequestConfig | undefined = undefined;

const EmbedChainInfos: ChainInfo =
{
    rpc: CRYPTO_ORG_RPC_ENDPOINT,
    rpcConfig: CRYPTO_ORG_RPC_CONFIG,
    rest: CRYPTO_ORG_REST_ENDPOINT,
    restConfig: CRYPTO_ORG_REST_CONFIG,
    // chainId: "crypto-org-chain-mainnet-1",
    chainId: "testnet-croeseid-3",
    chainName: "Crypto.org",
    stakeCurrency: {
        coinDenom: "tcro",
        coinMinimalDenom: "basetcro",
        coinDecimals: 8,
        coinGeckoId: "crypto-com-chain",
    },
    walletUrl:
        process.env.NODE_ENV === "production"
            ? "https://wallet.keplr.app/#/crypto-org/stake"
            : "http://localhost:8081/#/crypto-org/stake",
    walletUrlForStaking:
        process.env.NODE_ENV === "production"
            ? "https://wallet.keplr.app/#/crypto-org/stake"
            : "http://localhost:8081/#/crypto-org/stake",
    bip44: {
        // coinType: 394,
        coinType: 1,
    },
    bech32Config: Bech32Address.defaultBech32Config("tcro"),
    currencies: [
        {
            coinDenom: "tcro",
            coinMinimalDenom: "basetcro",
            coinDecimals: 8,
            coinGeckoId: "crypto-com-chain",
        },
    ],
    feeCurrencies: [
        {
            coinDenom: "tcro",
            coinMinimalDenom: "basetcro",
            coinDecimals: 8,
            coinGeckoId: "crypto-com-chain",
        },
    ],
    gasPriceStep: {
        low: 0.025,
        average: 0.03,
        high: 0.04,
    },
    features: ["stargate", "ibc-transfer"],
};

export default EmbedChainInfos;