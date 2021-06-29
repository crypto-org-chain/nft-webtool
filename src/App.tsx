import React from "react";
import { Window as KeplrWindow } from "@keplr-wallet/types";
import { CroSDK, CroNetwork } from '@crypto-org-chain/chain-jslib';
import { SigningCosmosClient } from "@cosmjs/launchpad";
import { Alert, Form, Button, Container, Accordion, Card, Row, Col, Navbar } from 'react-bootstrap';
import EmbedChainInfos from './chainInfo';

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
}
const chainId = "testnet-croeseid-3";

class App extends React.Component<IProps, IState> {
  constructor(props: IProps) {
    super(props);
    this.state = {
      msgIssueDenom: undefined,
      msgMintNFT: undefined,
      keplr: undefined,
      signer: ''
    };

    this.handleMsgIssueDenomSubmit = this.handleMsgIssueDenomSubmit.bind(this);
    this.handleMsgmintNftSubmit = this.handleMsgmintNftSubmit.bind(this);
  }

  async handleMsgIssueDenomSubmit(event: any) {
    try {
      let crosdk = CroSDK({ network: CroNetwork.TestnetCroeseid3 });
      const chainId = "testnet-croeseid-3";
      let msgIssueDenom = new crosdk.nft.MsgIssueDenom({ ...this.state.msgIssueDenom, sender: this.state.signer });

      console.log(document.getElementsByName('msgIssueDenom')[0]);
      const cosmJS = new SigningCosmosClient(
        "https://testnet-croeseid-3.crypto.org:1317/",
        this.state.signer,
        window.getOfflineSigner(chainId)
      );

      cosmJS.signAndBroadcast([msgIssueDenom.toRawAminoMsg()], cosmJS.fees.send, 'optionalMemo')
        .then(result => {
          alert(`Transaction Successful: TxHash : ${result.transactionHash}`);
        })
        .catch(err => {
          alert(`Transaction Error: TxHash : ${err.message || err}`);
        })

    } catch (error) {
      console.error(error)
    }
    event.preventDefault();
  }
  async handleMsgmintNftSubmit(event: any) {
    try {
      let crosdk = CroSDK({ network: CroNetwork.TestnetCroeseid3 });
      let msgMintNFT = new crosdk.nft.MsgMintNFT({ ...this.state.msgMintNFT, sender: this.state.signer });

      const cosmJS = new SigningCosmosClient(
        "https://testnet-croeseid-3.crypto.org:1317/",
        this.state.signer,
        window.getOfflineSigner(chainId)
      );

      cosmJS.signAndBroadcast([msgMintNFT.toRawAminoMsg()], cosmJS.fees.send, 'optionalMemo')
        .then(result => {
          alert(`Transaction Successful: TxHash : ${result.transactionHash}`);
        })
        .catch(err => {
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
                  <Form onSubmit={this.handleMsgIssueDenomSubmit} name='msgIssueDenom'>
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
                      <Form.Control type="text" onChange={
                        (e: any) => {
                          let msgIssueDenomClone = { ...this.state.msgIssueDenom };
                          msgIssueDenomClone.schema = e.target.value;
                          this.setState({
                            msgIssueDenom: msgIssueDenomClone
                          });
                        }
                      } />
                    </Form.Group>
                    <Form.Group controlId="form.msgIssueDenom.denom">
                      <Form.Label> Signer (Keplr): </Form.Label>
                      <Form.Control type="text" value={this.state.signer} readOnly={true} />
                    </Form.Group>
                    <Button variant="primary" type="submit" >
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
                  <Form onSubmit={this.handleMsgmintNftSubmit} name='msgMintNft'>
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
                      <Form.Control type="text" onChange={
                        (e: any) => {
                          let msgMintNftClone = { ...this.state.msgMintNFT };
                          msgMintNftClone.recipient = e.target.value;
                          this.setState({
                            msgMintNFT: msgMintNftClone
                          });
                        }
                      } />
                    </Form.Group>
                    <Form.Group controlId="form.msgMintNft.data">
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
                    </Form.Group>
                    <Form.Group controlId="form.msgMintNft.uri">
                      <Form.Label> URI: </Form.Label>
                      <Form.Control type="text" onChange={
                        (e: any) => {
                          let msgMintNftClone = { ...this.state.msgMintNFT };
                          msgMintNftClone.uri = e.target.value;
                          this.setState({
                            msgMintNFT: msgMintNftClone
                          });
                        }
                      } />
                    </Form.Group>
                    <Button variant="primary" type="submit" >
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

        {/* <form onSubmit={this.handleMsgIssueDenomSubmit} name='msgIssueDenom'> MsgIssueDenom
      <br></br>
          <label>
            Denom ID:
        <input type="text" name="denom_id"
              onChange={
                (e: any) => {
                  let msgIssueDenomClone = { ...this.state.msgIssueDenom };
                  msgIssueDenomClone.id = e.target.value;
                  this.setState({
                    msgIssueDenom: msgIssueDenomClone
                  });
                }
              } />
          </label>
          <br></br>
          <label>
            Denom name:
        <input type="text" name="denom_name"
              onChange={
                (e: any) => {
                  let msgIssueDenomClone = { ...this.state.msgIssueDenom };
                  msgIssueDenomClone.name = e.target.value;
                  this.setState({
                    msgIssueDenom: msgIssueDenomClone
                  });
                }
              } />
            <br></br>
          </label>
          <label>
            Denom Schema:
        <input type="text" name="denom_schema"
              onChange={
                (e: any) => {
                  let msgIssueDenomClone = { ...this.state.msgIssueDenom };
                  msgIssueDenomClone.schema = e.target.value;
                  this.setState({
                    msgIssueDenom: msgIssueDenomClone
                  });
                }
              } />
            <br></br>
          </label>
          <label>
            Keplr Signer:
        <input type="text" name="denom_sender" value={this.state.signer} readOnly={true} />
            <br></br>
          </label>
          <input type="submit" value="Submit" />
        </form> */}
      </Container>
    );
  }
}

export default App;
