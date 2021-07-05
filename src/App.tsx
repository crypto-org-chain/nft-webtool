import React from "react";
import { Window as KeplrWindow } from "@keplr-wallet/types";
import { CroSDK, CroNetwork } from '@crypto-org-chain/chain-jslib';
import { SigningCosmosClient } from "@cosmjs/launchpad";
import { SigningStargateClient, SigningStargateClientOptions } from "@cosmjs/stargate";
import { Form, Button, Container, Accordion, Card, Row, Col, Navbar } from 'react-bootstrap';
import EmbedChainInfos from './chainInfo';
import { uploadMediaToIPFS, fetchIPFS, getSignDoc } from "./request/client";
import { ProtoSignDocDecoder } from "@keplr-wallet/cosmos";
import { SignableTransaction } from "@crypto-org-chain/chain-jslib/lib/dist/transaction/signable";
import { Bytes } from "@crypto-org-chain/chain-jslib/lib/dist/utils/bytes/bytes";
import { Big } from "big.js";
import { chainmain } from "@crypto-org-chain/chain-jslib/lib/dist/cosmos/v1beta1/codec";
import { typeUrlMappings } from "./config/typeUrlMappings";
import { Registry } from '@cosmjs/proto-signing';
import { NFT_IMAGE_DENOM_SCHEMA } from "./config/schema";

interface IProps {

}
interface MsgIssueDenomOptions {
  id: string;
  name: string;
  schema: string;
  sender: string;
};

interface MsgMintNFTOptions {
  id: string;
  denomId: string;
  name: string;
  uri: string;
  data: string;
  sender: string;
  recipient: string;
};

interface IState {
  msgIssueDenom?: MsgIssueDenomOptions;
  msgMintNFT?: MsgMintNFTOptions;
  keplr?: KeplrWindow;
  signer: string;
  mintNFTFile?: File;
  mintNFTDescription?: string | undefined;
}
const chainId = "testnet-croeseid-3";

function convertIpfsToHttp(ipfsUrl: string) {
  if (ipfsUrl.indexOf('ipfs://') === 0) {
    return ipfsUrl.replace(/ipfs:\/\//i, 'https://ipfs.io/ipfs/');
  }
  throw new Error('Invalid IPFS URL');
}

const isVideo = (type: string | undefined) => {
  return type?.indexOf('video') !== -1;
};

class customSigningOptions implements SigningStargateClientOptions {
  public registry;
  constructor() {
    this.registry = new Registry(Object.entries(typeUrlMappings));
  }
}

class App extends React.Component<IProps, IState> {
  constructor(props: IProps) {
    super(props);
    this.state = {
      msgIssueDenom: undefined,
      msgMintNFT: undefined,
      keplr: undefined,
      signer: '',
      mintNFTFile: undefined
    };

    this.handleMsgIssueDenomSubmit = this.handleMsgIssueDenomSubmit.bind(this);
    this.handleMsgmintNftSubmit = this.handleMsgmintNftSubmit.bind(this);
  }

  async handleMsgIssueDenomSubmit(event: any) {
    try {
      let crosdk = CroSDK({ network: CroNetwork.TestnetCroeseid3 });

      let msgIssueDenom = new crosdk.nft.MsgIssueDenom({
        ...this.state.msgIssueDenom,
        sender: this.state.signer,
        schema: JSON.stringify(NFT_IMAGE_DENOM_SCHEMA)
      });

      const signCLient = await SigningStargateClient.connectWithSigner(
        "https://testnet-croeseid-3.crypto.org:26657"
        , this.state.keplr.getOfflineSigner(chainId), new customSigningOptions());

      signCLient.signAndBroadcast(this.state.signer, [msgIssueDenom.toRawMsg()], signCLient.fees.transfer, 'my memo')
        .then(result => {
          console.log('result', result)
          alert(`Transaction Successful: TxHash : ${result.transactionHash}`);
        })
        .catch(err => {
          console.log('error broad', err)
          alert(`Transaction Error: TxHash : ${err.message || err}`);
        })

    } catch (error) {
      console.error(error)
    }
    event.preventDefault();
  }
  async handleMsgmintNftSubmit(event: any) {
    try {
      if (typeof this.state.mintNFTFile === 'undefined') {
        alert('Please upload a media file for NFT.')
        return;
      }
      let crosdk = CroSDK({ network: CroNetwork.TestnetCroeseid3 });

      const uploadResult = await uploadMediaToIPFS(this.state.mintNFTFile);

      if (uploadResult.status !== 200) {
        alert('Uploading file to IPFS Failed.')
        return;
      }
      if (uploadResult.data.status != 200) {
        alert('Uploading file to IPFS Failed. Reason: ' + uploadResult.data.message)
        return;
      }

      const mintNftURI = convertIpfsToHttp(uploadResult.data.ipfsUrl);
      const mediaDetails = await fetchIPFS(mintNftURI);
      const nftImageURL = convertIpfsToHttp(mediaDetails.data.image)

      const mimeType = this.state.mintNFTFile.type;

      const data = {
        name: this.state.msgMintNFT.name,
        drop: this.state.msgMintNFT.name,
        description: this.state.mintNFTDescription,
        image: nftImageURL,
        animation_url: isVideo(mimeType) ? 'videoUrl' : undefined,
        mimeType: mimeType,
      };



      let msgMintNFT = new crosdk.nft.MsgMintNFT({
        ...this.state.msgMintNFT,
        sender: this.state.signer,
        recipient: this.state.signer,
        uri: mintNftURI,
        data: JSON.stringify(data)
      });

      const signCLient = await SigningStargateClient.connectWithSigner(
        "https://testnet-croeseid-3.crypto.org:26657"
        , this.state.keplr.getOfflineSigner(chainId), new customSigningOptions());

      signCLient.signAndBroadcast(this.state.signer, [msgMintNFT.toRawMsg()], signCLient.fees.transfer, 'my memo')
        .then(result => {
          console.log('result', result)
          alert(`Transaction Successful: TxHash : ${result.transactionHash}`);
        })
        .catch(err => {
          console.log('error broad', err)
          alert(`Transaction Error: TxHash : ${err.message || err}`);
        })

    } catch (error) {
      console.error(error)
    }
    event.preventDefault();
  }
  async getKeplr(): Promise<KeplrWindow | undefined> {
    if (!window.getOfflineSigner || !window.keplr) {
      alert("Please install keplr extension");
    }

    if (window.keplr) {
      await window.keplr.experimentalSuggestChain(EmbedChainInfos)
      await window.keplr.enable(chainId)
      return window.keplr;
    }

    if (document.readyState === "complete") {
      return window.keplr;
    }

    return new Promise((resolve) => {
      const documentStateChange = (event: Event) => {
        if (
          event.target &&
          (event.target as Document).readyState === "complete"
        ) {
          resolve(window.keplr);
          document.removeEventListener("readystatechange", documentStateChange);
        }
      };

      document.addEventListener("readystatechange", documentStateChange);
    });
  }

  async componentDidMount() {
    const chainId = "testnet-croeseid-3";

    const keplrInstance = await this.getKeplr()
    const offlineSigner = await keplrInstance?.getOfflineSigner!(chainId);
    const accounts = await offlineSigner!.getAccounts();
    alert('accounts:' + accounts[0].address)
    const signer = accounts[0].address;

    this.setState({ keplr: keplrInstance, signer })
  }

  render() {
    return (

      <Container className="p-3">
        <Navbar bg="dark" variant="dark">
          <Navbar.Brand href="#home">
            <img
              alt="CRO NFT"
              src="https://crypto.com/price/coin-data/icon/CRO/color_icon.png"
              width="30"
              height="30"
              className="d-inline-block align-top"
            />{' '}
                Crypto.com NFT Manager
              </Navbar.Brand>
        </Navbar>
        {/* MAIN ROW */}
        <Row>
          <Accordion as={Col}>
            <Card>
              <Card.Header>
                <Accordion.Toggle as={Button} variant="link" eventKey="0">
                  Issue a new `DENOM`
      </Accordion.Toggle>
              </Card.Header>
              <Accordion.Collapse eventKey="0">
                <Card.Body>
                  <Form name='msgIssueDenom'>
                    <Form.Group controlId="form.msgIssueDenom.denomId">
                      <Form.Label>Denom ID: </Form.Label>
                      <Form.Control type="text" onChange={
                        (e: any) => {
                          let msgIssueDenomClone = { ...this.state.msgIssueDenom };
                          msgIssueDenomClone.id = e.target.value;
                          this.setState({
                            msgIssueDenom: msgIssueDenomClone
                          });
                        }
                      } />
                    </Form.Group>
                    <Form.Group controlId="form.msgIssueDenom.denomName">
                      <Form.Label>Denom Name: </Form.Label>
                      <Form.Control type="text" onChange={
                        (e: any) => {
                          let msgIssueDenomClone = { ...this.state.msgIssueDenom };
                          msgIssueDenomClone.name = e.target.value;
                          this.setState({
                            msgIssueDenom: msgIssueDenomClone
                          });
                        }
                      } />
                    </Form.Group>
                    <Form.Group controlId="form.msgIssueDenom.denomSchema">
                      <Form.Label>Denom Schema: </Form.Label>
                      <Form.Control as="textarea" value={JSON.stringify(NFT_IMAGE_DENOM_SCHEMA, null, 2)}
                        style={{ height: '100px' }} readOnly />
                    </Form.Group>
                    <Form.Group controlId="form.msgIssueDenom.denom">
                      <Form.Label> Signer (Keplr): </Form.Label>
                      <Form.Control type="text" value={this.state.signer} readOnly={true} />
                    </Form.Group>
                    <Button variant="primary" type="button" onClick={this.handleMsgIssueDenomSubmit}>
                      Get it issued! </Button>
                  </Form>
                </Card.Body>
              </Accordion.Collapse>
            </Card>
            <Card>
              <Card.Header>
                <Accordion.Toggle as={Button} variant="link" eventKey="1">
                  Mint a new `NFT`
      </Accordion.Toggle>
              </Card.Header>
              <Accordion.Collapse eventKey="1">
                <Card.Body>
                  <Form name='msgMintNft'>
                    <Form.Group controlId="form.msgMintNft.id">
                      <Form.Label>NFT ID: </Form.Label>
                      <Form.Control type="text" onChange={
                        (e: any) => {
                          let msgMintNftClone = { ...this.state.msgMintNFT };
                          msgMintNftClone.id = e.target.value;
                          this.setState({
                            msgMintNFT: msgMintNftClone
                          });
                        }
                      } />
                    </Form.Group>
                    <Form.Group controlId="form.msgMintNft.denom_id">
                      <Form.Label>Denom ID: </Form.Label>
                      <Form.Control type="text" onChange={
                        (e: any) => {
                          let msgMintNftClone = { ...this.state.msgMintNFT };
                          msgMintNftClone.denomId = e.target.value;
                          this.setState({
                            msgMintNFT: msgMintNftClone
                          });
                        }
                      } />
                    </Form.Group>
                    <Form.Group controlId="form.msgMintNft.name">
                      <Form.Label>NFT Name: </Form.Label>
                      <Form.Control type="text" onChange={
                        (e: any) => {
                          let msgMintNftClone = { ...this.state.msgMintNFT };
                          msgMintNftClone.name = e.target.value;
                          this.setState({
                            msgMintNFT: msgMintNftClone
                          });
                        }
                      } />
                    </Form.Group>
                    <Form.Group controlId="form.msgMintNft.sender">
                      <Form.Label> Sender (Keplr): </Form.Label>
                      <Form.Control type="text" value={this.state.signer} readOnly={true} />
                    </Form.Group>
                    <Form.Group controlId="form.msgMintNft.recipient">
                      <Form.Label> Recipient Address: </Form.Label>
                      <Form.Control type="text"
                        value={this.state.signer}
                        onChange={
                          (e: any) => {
                            let msgMintNftClone = { ...this.state.msgMintNFT };
                            msgMintNftClone.recipient = e.target.value;
                            this.setState({
                              msgMintNFT: msgMintNftClone
                            });
                          }
                        } />
                    </Form.Group>
                    <Form.Group controlId="form.msgMintNft.data" className="mb-3">
                      <Form.Label>Upload your Art media file:</Form.Label>
                      <Form.File type="file" onChange={(e: any) => {
                        const uploadedFile = e.target.files[0];
                        this.setState({
                          mintNFTFile: uploadedFile
                        })
                      }
                      } />
                    </Form.Group>
                    {/* <Form.Group controlId="form.msgMintNft.data">
                      <Form.Label> Data: </Form.Label>
                      <Form.Control type="text" onChange={
                        (e: any) => {
                          let msgMintNftClone = { ...this.state.msgMintNFT };
                          msgMintNftClone.data = e.target.value;
                          this.setState({
                            msgMintNFT: msgMintNftClone
                          });
                        }
                      } />
                    </Form.Group> */}
                    <Form.Group controlId="form.msgMintNft.description">
                      <Form.Label> Description: </Form.Label>
                      <Form.Control type="text" onChange={
                        (e: any) => {
                          this.setState({
                            mintNFTDescription: e.target.value
                          });
                        }
                      } />
                    </Form.Group>
                    <Button variant="primary" type="button" onClick={this.handleMsgmintNftSubmit} >
                      Mint it now! </Button>
                  </Form>

                </Card.Body>
              </Accordion.Collapse>
            </Card>
          </Accordion>

        </Row>

        {/* EMPTY ROW */}
        <Row>
        </Row>
      </Container>
    );
  }
}

export default App;
