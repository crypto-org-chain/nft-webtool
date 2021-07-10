import { SigningStargateClient, SigningStargateClientOptions } from '@cosmjs/stargate';
import { Registry } from '@cosmjs/proto-signing';
import { CroSDK } from '@crypto-org-chain/chain-jslib';
import axios from 'axios';
import { StorageService } from '../storage/StorageService';
import {
  APP_DB_NAMESPACE,
  DefaultWalletConfigs,
  chainInfoCroeseid3,
  typeUrlMappings,
} from '../config/StaticConfig';
import { AssetMarketPrice } from '../models/UserAsset';
import {
  BroadCastResult,
  NftDenomModel,
} from '../models/Transaction';
import { ChainIndexingAPI } from './rpc/ChainIndexingAPI';
import {
  NFTDenomIssueRequest,
  NFTMintRequest,
} from './TransactionRequestModels';


import {
  reconstructCustomConfig,
} from '../models/Wallet';

class CustomSigningOptions implements SigningStargateClientOptions {
  public registry;

  constructor() {
    this.registry = new Registry(Object.entries(typeUrlMappings));
  }
}

class WalletService {
  private readonly storageService: StorageService;

  constructor() {
    this.storageService = new StorageService(APP_DB_NAMESPACE);
  }

  public readonly BROADCAST_TIMEOUT_CODE = -32603;

  public broadcastMintNFT = async (nftMintRequest: NFTMintRequest): Promise<BroadCastResult> => {
    const cro = CroSDK({ network: DefaultWalletConfigs.TestNetCroeseid3.network });
    const msgMintNFT = new cro.nft.MsgMintNFT({
      id: nftMintRequest.tokenId,
      name: nftMintRequest.name,
      sender: nftMintRequest.sender,
      denomId: nftMintRequest.denomId,
      uri: nftMintRequest.uri,
      data: nftMintRequest.data,
      recipient: nftMintRequest.recipient,
    });

    const signClient = await SigningStargateClient.connectWithSigner(
      chainInfoCroeseid3.rpc
      , nftMintRequest.keplr.getOfflineSigner(chainInfoCroeseid3.chainId), new CustomSigningOptions());

    const broadcastResult = await signClient.signAndBroadcast(nftMintRequest.sender, [msgMintNFT.toRawMsg()], { amount: [{ amount: '200000', denom: 'basetcro' }], gas: '100000' }, nftMintRequest.memo)

    return {
      transactionHash: broadcastResult.transactionHash,
      message: broadcastResult.rawLog,
      code: broadcastResult.height
    }
  }

  public broadcastNFTDenomIssueTx = async (
    nftDenomIssueRequest: NFTDenomIssueRequest,
  ): Promise<BroadCastResult> => {
    const cro = CroSDK({ network: DefaultWalletConfigs.TestNetCroeseid3.network });
    const msgIssueDenom = new cro.nft.MsgIssueDenom({
      id: nftDenomIssueRequest.denomId,
      name: nftDenomIssueRequest.name,
      sender: nftDenomIssueRequest.sender,
      schema: nftDenomIssueRequest.schema
    });

    const signClient = await SigningStargateClient.connectWithSigner(
      chainInfoCroeseid3.rpc
      , nftDenomIssueRequest.keplr.getOfflineSigner(chainInfoCroeseid3.chainId), new CustomSigningOptions());

    const broadcastResult = await signClient.signAndBroadcast(nftDenomIssueRequest.sender, [msgIssueDenom.toRawMsg()], { amount: [{ amount: '200000', denom: 'basetcro' }], gas: '100000' }, nftDenomIssueRequest.memo)

    return Promise.resolve({
      transactionHash: broadcastResult.transactionHash,
      message: broadcastResult.rawLog,
      code: broadcastResult.height
    })
  }

  public async retrieveAssetPrice(
    assetSymbol: string,
    currency: string = 'USD',
  ): Promise<AssetMarketPrice> {
    const price = await this.storageService.retrieveAssetPrice(assetSymbol, currency);
    return {
      ...price,
    };
  }

  // eslint-disable-next-line class-methods-use-this
  public async checkNodeIsLive(nodeUrl: string): Promise<boolean> {
    try {
      await axios.head(nodeUrl);
      return true;
    } catch (error) {
      if (error && error.response) {
        const { status } = error.response;
        return !(status >= 400 && status < 500);
      }
    }

    return false;
  }

  // eslint-disable-next-line
  public async getDenomIdData(denomId: string): Promise<NftDenomModel | null> {
    try {
      const chainIndexAPI = ChainIndexingAPI.init(DefaultWalletConfigs.TestNetCroeseid3.indexingUrl);
      const nftDenomData = await chainIndexAPI.fetchNftDenomData(denomId);

      return nftDenomData.result;
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log('FAILED_LOADING NFT denom data', e);

      return null;
    }
  }
}

export const walletService = new WalletService();
