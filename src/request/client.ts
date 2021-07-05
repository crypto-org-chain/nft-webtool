import { NFT_STORAGE } from '../config/nft.storage'
import ky from 'axios';
import { Bytes } from '@crypto-org-chain/chain-jslib/lib/dist/utils/bytes/bytes';
import Big from 'big.js';
import { SignableTransaction } from '@crypto-org-chain/chain-jslib/lib/dist/transaction/signable';
import { ProtoSignDocDecoder } from '@keplr-wallet/cosmos';
import { CroSDK, CroNetwork } from '@crypto-org-chain/chain-jslib';
import { CosmosMsg } from '@crypto-org-chain/chain-jslib/lib/dist/transaction/msg/cosmosMsg';

interface UploadSuccessResponse {
    "status": number,
    "ipfsUrl": string,
    "message": string
}

interface itemIPFSDetails {
    "name": string,
    "description": string,
    "image": string
}
const createFormData = (file: File) => {
    let formData = new FormData();
    // formData.append("imageFile", file);
    formData.append("imageFile", file);
    //todo: support multiple files and video
    console.log(formData.get('imageFile'));
    return formData;
}

export const uploadMediaToIPFS = async (file: File) => {
    try {
        const formData: FormData = createFormData(file);
        const uploadResponse = await ky.post<UploadSuccessResponse>(NFT_STORAGE.BASE_URL, formData, {
            onUploadProgress: (event) => { console.log(event) },
            headers: { 'content-type': 'multipart/form-data' }
        })
        console.log(uploadResponse)

        return uploadResponse;
    } catch (error) {
        console.error(error)
    }
}

export const fetchIPFS = async (url: string) => {

    const itemDetails = await ky.get<itemIPFSDetails>(url)
    console.log(itemDetails)
    return itemDetails;
}

(() => {
    ky.get('http://localhost:3001').then(console.log).catch(console.error);
})()

export const getSignDoc = async (signerPubkey: Uint8Array, accountNumber: number, sequence: number, crosdk: any, msgMintNFT: CosmosMsg) => {
    const keplrSigner = {
        publicKey: Bytes.fromUint8Array(signerPubkey),
        accountNumber: new Big(accountNumber),
        accountSequence: new Big(sequence),
    };
    console.log('keprSIgner', keplrSigner)
    const rawTx = new crosdk.RawTransaction();

    const signableTx = rawTx.appendMessage(msgMintNFT).addSigner(keplrSigner).toSignable() as SignableTransaction;

    const signDoc = ProtoSignDocDecoder.decode(signableTx.toSignDocument(0).toUint8Array()).signDoc;

    console.log('signDoc decoded', signDoc)
    return { signDoc, signableTx };
}