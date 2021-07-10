import React, { useState, useEffect, useRef } from 'react';
import { Keplr } from "@keplr-wallet/types";
import './nft.less';
import 'antd/dist/antd.css';
import {
  Layout,
  Card,
  Tabs,
  Radio,
  Button,
  Form,
  Input,
  Upload,
  Image,
  Spin,
  message,
  notification,
  Typography, Space, Select
} from 'antd';
import Big from 'big.js';
import {
  MenuOutlined,
  ExclamationCircleOutlined,
  UploadOutlined,
  LoadingOutlined,
  WarningOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { useRecoilValue, useRecoilState, useSetRecoilState } from 'recoil';
import ReactPlayer from 'react-player';
import axios from 'axios';

import {
  sessionState,
  nftListState,
  fetchingDBState,
  walletAssetState,
  ledgerIsExpertModeState,
} from '../../recoil/atom';
import {
  convertIpfsToHttp,
  sleep,
  useWindowSize,
} from '../../utils/utils';
import { getUINormalScaleAmount } from '../../utils/NumberUtils';
import { BroadCastResult } from '../../models/Transaction';
import {
  IPFS_MIDDLEWARE_SERVER_UPLOAD_ENDPOINT,
  FIXED_DEFAULT_FEE,
  NFT_IMAGE_DENOM_SCHEMA,
  NFT_VIDEO_DENOM_SCHEMA,
  MAX_IMAGE_SIZE,
  MAX_VIDEO_SIZE,
  chainInfoCroeseid3,
} from '../../config/StaticConfig';

import { walletService } from '../../service/WalletService';
import { detectConditionsError, LEDGER_WALLET_TYPE } from '../../service/LedgerService';
// import {
//   AnalyticsActions,
//   AnalyticsCategory,
//   // AnalyticsService,
//   AnalyticsTxType,
// } from '../../service/analytics/AnalyticsService';

import ModalPopup from '../../components/ModalPopup/ModalPopup';
import SuccessModalPopup from '../../components/SuccessModalPopup/SuccessModalPopup';
import ErrorModalPopup from '../../components/ErrorModalPopup/ErrorModalPopup';
import PasswordFormModal from '../../components/PasswordForm/PasswordFormModal';
import nftThumbnail from '../../assets/nft-thumbnail.png';

const { Option } = Select;
const { Text, Link } = Typography;
const { Header, Content, Footer, Sider } = Layout;
const { TabPane } = Tabs;
const layout = {};
const { TextArea } = Input;

const isVideo = (type: string | undefined) => {
  return type?.indexOf('video') !== -1;
};

const supportedVideo = (mimeType: string | undefined) => {
  switch (mimeType) {
    case 'video/mp4':
      // case 'video/webm':
      // case 'video/ogg':
      // case 'audio/ogg':
      // case 'audio/mpeg':
      return true;
    default:
      return false;
  }
};

const multiplyFee = (fee: string, multiply: number) => {
  return Big(fee)
    .times(multiply)
    .toString();
};

const FormMintNft = (props: { keplr: Keplr, keplrSigner: string | undefined }) => {
  const { keplr, keplrSigner } = props;
  const [form] = Form.useForm();
  const [formValues, setFormValues] = useState({
    fileList: '',
    tokenId: '',
    denomId: '',
    drop: '',
    description: '',
    senderAddress: '',
    recipientAddress: '',
    data: '',
    uri: '',
    amount: '',
    memo: '',
  });
  const currentSession = useRecoilValue(sessionState);

  const [isConfirmationModalVisible, setIsVisibleConfirmationModal] = useState(false);
  const [isSuccessModalVisible, setIsSuccessModalVisible] = useState(false);
  const [isErrorModalVisible, setIsErrorModalVisible] = useState(false);
  const [isUploadButtonVisible, setIsUploadButtonVisible] = useState(true);
  const [, setInputPasswordVisible] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const [isUploadSuccess, setIsUploadSuccess] = useState(false);
  const [isBeforeUpload, setIsBeforeUpload] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isDenomIdOwner, setIsDenomIdOwner] = useState(false);
  const [isDenomIdIssued, setIsDenomIdIssued] = useState(false);

  const [ipfsMediaJsonUrl, setIpfsMediaJsonUrl] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [files, setFiles] = useState<any[]>([]);
  const [fileType, setFileType] = useState('');

  const [decryptedPhrase, setDecryptedPhrase] = useState('');
  const [broadcastResult, setBroadcastResult] = useState<BroadCastResult>({});
  const [errorMessages, setErrorMessages] = useState([]);

  useEffect(() => {
    // getInjectedKeplr();
  }, [keplrSigner, keplr]);

  const networkFee =
    currentSession.wallet.config.fee !== undefined &&
      currentSession.wallet.config.fee.networkFee !== undefined
      ? currentSession.wallet.config.fee.networkFee
      : FIXED_DEFAULT_FEE;

  const closeSuccessModal = () => {
    setIsSuccessModalVisible(false);
    // setIsErrorModalVisible(false);
    setIsVisibleConfirmationModal(false);
  };

  const closeErrorModal = () => {
    setIsErrorModalVisible(false);
  };

  const fileUploadValidator = () => ({
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    validator(rule, value) {
      const reason = `File upload failed. Please upload again.`;
      if (
        (isUploadSuccess && !isVideo(fileType) && files.length === 1) ||
        (isUploadSuccess && isVideo(fileType) && files.length === 2)
      ) {
        return Promise.resolve();
      }
      // Hide the error before uploading anything
      if (isBeforeUpload) {
        return Promise.reject();
      }
      // Hide the error when uploading or upload video in progress
      if (isUploading || (files.length === 1 && isVideo(fileType))) {
        return Promise.reject();
      }
      return Promise.reject(reason);
    },
  });

  const showConfirmationModal = async () => {
    setInputPasswordVisible(false);
    setIsVisibleConfirmationModal(true);
    setFormValues({
      ...form.getFieldsValue(true),
      senderAddress: keplrSigner,
      recipientAddress: keplrSigner,
    });
    console.log('fetching deonom')
    const denomData = await walletService.getDenomIdData(form.getFieldValue('denomId'));
    console.log('fetching denom:', denomData)

    if (denomData) {
      // Denom ID registered
      setIsDenomIdIssued(true);
      if (denomData.denomCreator === keplrSigner) {
        console.log('denomData.denomCreator === keplrSigner', denomData.denomCreator === keplrSigner)
        setIsDenomIdOwner(true);
      } else {
        setIsDenomIdOwner(false);
      }
    } else {
      // Denom ID not registered yet
      setIsDenomIdIssued(false);
      setIsDenomIdOwner(true);
    }
  };

  const onWalletDecryptFinish = async () => {
    // const phraseDecrypted = await secretStoreService.decryptPhrase(
    //   password,
    //   currentSession.wallet.identifier,
    // );
    const phraseDecrypted = 'somepharsase';
    setDecryptedPhrase(phraseDecrypted);
    await showConfirmationModal();
  };

  const beforeUpload = file => {
    let error = false;
    const isVideoFile = isVideo(file.type);
    const isSupportedVideo = supportedVideo(file.type);
    const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
    const isImageTooLarge = file.size > MAX_IMAGE_SIZE;
    const isVideoTooLarge = file.size > MAX_VIDEO_SIZE;
    if (isVideoFile && !isVideo(fileType)) {
      if (!isSupportedVideo) {
        message.error('You can only upload MP4 file!');
        error = true;
      }
      if (isVideoTooLarge) {
        message.error('Video must smaller than 20MB!');
        error = true;
      }
    } else {
      if (!isJpgOrPng) {
        message.error('You can only upload JPG/PNG file!');
        error = true;
      }
      if (isImageTooLarge) {
        message.error('Image must smaller than 10MB!');
        error = true;
      }
    }

    if (error) {
      return Upload.LIST_IGNORE;
    }

    return true;
  };

  const handleChange = ({ fileList }) => {
    if (fileList.length === 0) {
      setIsUploadButtonVisible(true);
      setIsUploadSuccess(false);
      setFileType('');
    } else if (fileList.length === 1) {
      if (isVideo(fileList[0].type)) {
        setIsUploadButtonVisible(true);
      } else {
        setIsUploadButtonVisible(false);
      }
      setFileType(fileList[0].type);
    } else {
      setIsUploadButtonVisible(false);
    }
    setIsBeforeUpload(false);
    setFiles(fileList);
  };

  const onMintNft = async () => {
    const walletType = 'normal';
    const memo = formValues.memo !== null && formValues.memo !== undefined ? formValues.memo : '';
    if (typeof keplrSigner === "undefined") {
      notification.warning({
        message: 'Unauthorised or Not Connected',
        description:
          'Please ensure you have `Keplr` extension installed on your browser.',
        icon: <WarningOutlined style={{ color: '#108ee9' }} />,
      })
      return;
    }
    const data = {
      name: formValues.drop,
      drop: formValues.drop,
      description: formValues.description,
      image: imageUrl,
      animation_url: isVideo(fileType) ? videoUrl : undefined,
      mimeType: fileType,
    };
    try {
      setConfirmLoading(true);

      if (!isDenomIdIssued) {
        console.log('Denom not issued')
        throw new Error('The Denom ID you entered is not existent. Please input another denom-id.');
      } else {
        const mintNftResult = await walletService.broadcastMintNFT({
          tokenId: formValues.tokenId,
          denomId: formValues.denomId,
          sender: formValues.senderAddress,
          recipient: formValues.recipientAddress,
          data: JSON.stringify(data),
          name: formValues.drop,
          uri: ipfsMediaJsonUrl,
          memo,
          keplr,
          walletType,
        });
        console.log('mintNftResult', mintNftResult)
        setBroadcastResult(mintNftResult);
        setIsSuccessModalVisible(true);
      }
      setIsErrorModalVisible(false);
      setConfirmLoading(false);
      setIsVisibleConfirmationModal(false);

      form.resetFields();
      setIpfsMediaJsonUrl('');
      setImageUrl('');
      setVideoUrl('');
      setFiles([]);
      setFileType('');
      setIsUploadButtonVisible(true);
    } catch (e) {
      setErrorMessages(e.message.split(': '));
      setIsVisibleConfirmationModal(false);
      setConfirmLoading(false);
      setInputPasswordVisible(false);
      setIsErrorModalVisible(true);
      // eslint-disable-next-line no-console
      console.log('Error occurred while transfer', e);
    }
  };

  const uploadButton = (
    <div>
      <UploadOutlined />
      <div style={{ marginTop: 8 }}>
        {isVideo(fileType) ? (
          <>
            Video Thumbnail
            <br />
            JPG, PNG
          </>
        ) : (
            <>
              Image: JPG, PNG <br />
            Video: MP4
          </>
          )}
      </div>
    </div>
  );

  const customRequest = async option => {
    const { onProgress, onError, onSuccess, action, file } = option;
    const url = action;
    const isVideoFile = isVideo(file.type);
    const isSupportedVideo = supportedVideo(file.type);
    const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
    const formData = new FormData();

    setIsUploading(true);
    // Uploaded Video
    if (files.length >= 2) {
      formData.append('videoFile', files[0].originFileObj);
    }

    if (isVideoFile && isSupportedVideo) {
      setIsUploading(false);
      onSuccess();
      return;
      // eslint-disable-next-line no-else-return
    } else if (isJpgOrPng) {
      formData.append('imageFile', file);
    } else {
      setIsUploading(false);
      setIsUploadSuccess(false);
      onError();
      return;
    }

    try {
      const response = await axios.post(url, formData, {
        onUploadProgress: e => {
          onProgress({ percent: (e.loaded / e.total) * 100 });
        },
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // const response = {
      //   data: {
      //     status: 200,
      //     ipfsUrl: "ipfs://bafyreigjrf6erwujlrffvjtg7yrfbl4ayfmuxyqiy3uma7joiwz333cfmu/metadata.json",
      //   }
      // }
      if (response.data.status === 200) {
        const ipfsUrl = convertIpfsToHttp(response.data.ipfsUrl);
        setIpfsMediaJsonUrl(ipfsUrl);
        const media: any = await axios.get(ipfsUrl);
        // const media: any = {
        //   data: {
        //     "name": "21_STARTUP_IDEAS.jpeg",
        //     "description": "21_STARTUP_IDEAS.jpeg",
        //     "image": "ipfs://bafybeif2b3vw2ude53mydp46n5hdre2okzebyrxta2vgnpbv44x6xmv2r4/21_STARTUP_IDEAS.jpeg"
        //   }
        // }
        setImageUrl(convertIpfsToHttp(media.data.image));
        if (media.data.animation_url) {
          setVideoUrl(convertIpfsToHttp(media.data.animation_url));
        }
        setIsUploadSuccess(true);
        setIsUploading(false);
        onSuccess(response);
      }
    } catch (e) {
      setIsUploadSuccess(false);
      setIsUploading(false);
      onError(e);
      notification.error({
        message: 'Upload failed',
        description: 'Please confirm your connection & try again later.',
        placement: 'topRight',
        duration: 5,
      });
    }
  };


  return (
    <>
      <Form
        {...layout}
        layout="vertical"
        form={form}
        name="control-ref-1"
        onFinish={onWalletDecryptFinish}
        requiredMark={false}
      >
        <Form.Item
          name="denomId"
          label="Denom ID"
          hasFeedback
          validateFirst
          rules={[
            { required: true, message: 'Denom ID is required' },
            {
              min: 3,
              max: 64,
              message: 'Expected length to be between 3 and 64 characters',
            },
            {
              pattern: /^[a-z]/,
              message: 'Denom ID can only start with lowercase alphabetic',
            },
            {
              pattern: /(^[a-z](([a-z0-9]){2,63})$)/,
              message: 'Expected only alphabetic characters or numbers',
            },
          ]}
        >
          <Input maxLength={64} placeholder='e.g. "denomid123"' />
        </Form.Item>
        <Form.Item
          name="tokenId"
          label="Token ID"
          hasFeedback
          validateFirst
          rules={[
            { required: true, message: 'Token ID is required' },
            {
              min: 3,
              max: 64,
              message: 'Expected length to be between 3 and 64 characters',
            },
            {
              pattern: /^[a-z]/,
              message: 'Denom ID can only start with lowercase alphabetic',
            },
            {
              pattern: /(^[a-z](([a-z0-9]){2,63})$)/,
              message: 'Expected only alphabetic characters or numbers',
            },
          ]}
        >
          <Input maxLength={64} placeholder='e.g. "edition123"' />
        </Form.Item>
        <Form.Item
          name="recipientAddress"
          label="Recipient Address"
          hasFeedback
          // validateFirst
          rules={[{ required: false, message: 'Recipient addresss is not required' }]}

        >
          <Input placeholder={keplrSigner} defaultValue={keplrSigner} readOnly />
        </Form.Item>
        <Form.Item
          name="drop"
          label="Drop Name"
          hasFeedback
          validateFirst
          rules={[{ required: true, message: 'Drop Name is required' }]}
        >
          <Input maxLength={64} placeholder='e.g. "Crypto.org Genesis"' />
        </Form.Item>
        <Form.Item name="description" label="Drop Description" hasFeedback>
          <TextArea
            showCount
            maxLength={1000}
            placeholder='e.g. "Commemorating the launch of the Crypto.org Chain and the Crypto.com NFT Platform..."'
          />
        </Form.Item>
        <Form.Item
          name="files"
          label="Upload Files"
          validateFirst
          hasFeedback
          rules={[{ required: false, message: 'Upload Files is required' }]}
        >
          <div>
            <Upload
              name="avatar"
              listType="picture-card"
              className="avatar-uploader"
              showUploadList={{
                showPreviewIcon: false,
              }}
              fileList={files}
              customRequest={customRequest}
              action={IPFS_MIDDLEWARE_SERVER_UPLOAD_ENDPOINT}
              beforeUpload={beforeUpload}
              onChange={handleChange}
              accept="audio/*,video/*,image/*"
              onRemove={file => {
                if (isVideo(file.type)) {
                  setVideoUrl('');
                } else {
                  setImageUrl('');
                }
                setIsBeforeUpload(true);
                setIsUploadSuccess(false);
              }}
            >
              {isUploadButtonVisible ? uploadButton : null}
            </Upload>
            {isUploading ? (
              <>
                <Spin
                  spinning
                  indicator={<LoadingOutlined />}
                  style={{ left: 'auto', marginRight: '5px' }}
                />{' '}
                Please wait until `file` upload finishes
              </>
            ) : (
                ''
              )}
            {isVideo(fileType) && files.length === 1 ? (
              <>
                <ExclamationCircleOutlined style={{ color: '#1199fa', marginRight: '5px' }} /> You
                have to upload a thumbnail for the video
              </>
            ) : (
                ''
              )}
          </div>
        </Form.Item>
        <ModalPopup
          isModalVisible={isConfirmationModalVisible}
          handleCancel={() => {
            if (!confirmLoading) {
              setIsVisibleConfirmationModal(false);
            }
          }}
          handleOk={() => { }}
          footer={[
            <Button
              key="submit"
              type="primary"
              onClick={onMintNft}
              loading={confirmLoading}
              disabled={(!isDenomIdIssued && !isDenomIdOwner) || (typeof keplr === "undefined")}
            >
              Confirm
            </Button>,
            <Button
              key="back"
              type="link"
              onClick={() => {
                if (!confirmLoading) {
                  setIsVisibleConfirmationModal(false);
                  setIsErrorModalVisible(false)
                }
              }}
            >
              Cancel
            </Button>,
          ]}
          button={
            <Button htmlType="submit" type="primary" onClick={onMintNft}>
              Review
            </Button>
          }
          okText="Confirm"
          className="nft-mint-modal"
        >
          <>
            <>
              <div className="title">Confirm Mint NFT</div>
              <div className="description">Please review the information below.</div>
              <div className="item">
                <div className="nft-image">
                  <Image
                    style={{ width: '100%', height: '100%' }}
                    src={imageUrl}
                    alt="avatar"
                    placeholder={<Spin spinning indicator={<LoadingOutlined />} />}
                    onError={e => {
                      (e.target as HTMLImageElement).src = nftThumbnail;
                    }}
                  />
                </div>
              </div>
              {isVideo(fileType) ? (
                <div className="item">
                  <div className="nft-video">
                    <ReactPlayer
                      url={videoUrl}
                      config={{
                        file: {
                          attributes: {
                            controlsList: 'nodownload',
                          },
                        },
                      }}
                      controls
                      playing={isConfirmationModalVisible}
                    />
                  </div>
                </div>
              ) : (
                  ''
                )}
              <div className="item">
                <div className="label">Denom ID</div>
                <div>{`${formValues.denomId}`}</div>
              </div>
              {!isDenomIdIssued || !isDenomIdOwner ? (
                <div className="item notice">
                  <Layout>
                    <Sider width="20px">
                      <ExclamationCircleOutlined style={{ color: '#f27474' }} />
                    </Sider>
                    <Content>
                      The Denom ID is either not registered or owned by other address.
                    </Content>
                  </Layout>
                </div>
              ) : (
                  ''
                )}
              <div className="item">
                <div className="label">Token ID</div>
                <div>{`${formValues.tokenId}`}</div>
              </div>
              <div className="item">
                <div className="label">Drop Name</div>
                <div>{`${formValues.drop}`}</div>
              </div>
              {formValues.description ? (
                <div className="item">
                  <div className="label">Drop Description</div>
                  <div>{`${formValues.description}`}</div>
                </div>
              ) : (
                  <></>
                )}
              <div className="item">
                <div className="label">Transaction Fee</div>
                <div>
                  {parseInt(networkFee, 10) / 1e8} {chainInfoCroeseid3.feeCurrencies[0].coinDenom}
                </div>
              </div>
              <div className="item notice">
                <Layout>
                  <Sider width="20px">
                    <ExclamationCircleOutlined style={{ color: '#1199fa' }} />
                  </Sider>
                  <Content>This NFT will be minted on the Crypto.org Chain.</Content>
                </Layout>
              </div>
            </>
          </>
        </ModalPopup>
      </Form>
      <SuccessModalPopup
        isModalVisible={isSuccessModalVisible}
        handleCancel={closeSuccessModal}
        handleOk={closeSuccessModal}
        title="Success!"
        button={null}
        footer={[
          <Button key="submit" type="primary" onClick={closeSuccessModal}>
            Ok
          </Button>,
        ]}
      >
        <>
          {broadcastResult?.code !== undefined &&
            broadcastResult?.code !== null &&
            broadcastResult.code === walletService.BROADCAST_TIMEOUT_CODE ? (
              <div className="description">
                The transaction timed out but it will be included in the subsequent blocks
              </div>
            ) : (
              <div className="description">
                <Layout>
                  <Sider width="20px">
                    <ExclamationCircleOutlined style={{ color: '#f27474' }} />
                  </Sider>
                  <Content  >
                    Your Mint NFT Tx has been broadcasted successfully: <Link href={`https://crypto.org/explorer/croeseid3/tx/${broadcastResult.transactionHash}`} target="_blank" >{broadcastResult.transactionHash}</Link>
                  </Content>
                </Layout>
              </div>
            )}
        </>
      </SuccessModalPopup>
      <ErrorModalPopup
        isModalVisible={isErrorModalVisible}
        handleCancel={closeErrorModal}
        handleOk={closeErrorModal}
        title="An error happened!"
        footer={[]}
      >
        <>
          <div className="description">
            The NFT transaction failed. Please try again later.
            <br />
            {errorMessages
              .filter((item, idx) => {
                return errorMessages.indexOf(item) === idx;
              })
              .map((err, idx) => (
                <div key={idx}>- {err}</div>
              ))}
          </div>
        </>
      </ErrorModalPopup>
    </>
  );
};

const FormIssueDenom = (props: { keplr: Keplr, keplrSigner: string | undefined }) => {
  const [form] = Form.useForm();
  const [formValues, setFormValues] = useState({
    name: '',
    denomId: '',
    sender: '',
    memo: '',
    schema: ''
  });
  const currentSession = useRecoilValue(sessionState);
  const [walletAsset] = useRecoilState(walletAssetState);
  const [ledgerIsExpertMode, setLedgerIsExpertMode] = useRecoilState(ledgerIsExpertModeState);

  const [isConfirmationModalVisible, setIsVisibleConfirmationModal] = useState(false);
  const [isSuccessModalVisible, setIsSuccessModalVisible] = useState(false);
  const [isErrorModalVisible, setIsErrorModalVisible] = useState(false);
  const [, setIsUploadButtonVisible] = useState(true);
  const [, setInputPasswordVisible] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const [isDenomIdOwner, setIsDenomIdOwner] = useState(false);
  const [isDenomIdIssued, setIsDenomIdIssued] = useState(false);

  const [isVideoSchema, setIsVideoSchema] = useState(false);
  const [, setImageUrl] = useState('');
  const [, setVideoUrl] = useState('');
  const [, setFiles] = useState<any[]>([]);
  const [, setFileType] = useState('');

  const [decryptedPhrase, setDecryptedPhrase] = useState('');
  const [broadcastResult, setBroadcastResult] = useState<BroadCastResult>({});
  const [errorMessages, setErrorMessages] = useState([]);
  const { keplr, keplrSigner } = props;

  useEffect(() => {
    // getInjectedKeplr();
  }, [keplr, keplrSigner]);

  const networkFee =
    currentSession.wallet.config.fee !== undefined &&
      currentSession.wallet.config.fee.networkFee !== undefined
      ? currentSession.wallet.config.fee.networkFee
      : FIXED_DEFAULT_FEE;

  const closeSuccessModal = () => {
    setIsSuccessModalVisible(false);
    setIsVisibleConfirmationModal(false);
    setIsErrorModalVisible(false);
  };

  const closeErrorModal = () => {
    setIsErrorModalVisible(false);
  };

  const showConfirmationModal = async () => {
    setInputPasswordVisible(false);
    setIsVisibleConfirmationModal(true);
    setFormValues({
      ...form.getFieldsValue(true),
      sender: keplrSigner
    });
    console.log('fetching deonom')
    const denomData = await walletService.getDenomIdData(form.getFieldValue('denomId'));
    console.log('fetching denom:', denomData)

    if (denomData) {
      // Denom ID registered
      setIsDenomIdIssued(true);
      if (denomData.denomCreator === keplrSigner) {
        setIsDenomIdOwner(true);
      } else {
        setIsDenomIdOwner(false);
      }
    } else {
      // Denom ID not registered yet
      setIsDenomIdIssued(false);
      setIsDenomIdOwner(true);
    }
  };


  const onWalletDecryptFinish = async () => {
    // const phraseDecrypted = await secretStoreService.decryptPhrase(
    //   password,
    //   currentSession.wallet.identifier,
    // );
    const phraseDecrypted = 'somepharsase';
    setDecryptedPhrase(phraseDecrypted);
    showConfirmationModal();
  };

  const onNftIssueDenom = async () => {
    const walletType = 'normal';
    const memo = formValues.memo !== null && formValues.memo !== undefined ? formValues.memo : '';
    if (typeof keplrSigner === "undefined") {
      notification.warning({
        message: 'Unauthorised or Not Connected',
        description:
          'Please ensure you have `Keplr` extension installed on your browser.',
        icon: <WarningOutlined style={{ color: '#108ee9' }} />,
      })
      return
    }

    try {
      setConfirmLoading(true);

      if (isDenomIdIssued) {
        throw new Error(`Denom ID is already issued. Please re-input another denomID`);
      } else {
        const issueDenomResult = await walletService.broadcastNFTDenomIssueTx({
          denomId: formValues.denomId,
          name: formValues.denomId,
          sender: keplrSigner,
          schema: isVideoSchema ? JSON.stringify(NFT_VIDEO_DENOM_SCHEMA) : JSON.stringify(NFT_IMAGE_DENOM_SCHEMA),
          memo,
          keplr,
          walletType,
        });
        setBroadcastResult(issueDenomResult);
        setIsSuccessModalVisible(true);
      }

      setIsErrorModalVisible(false);
      setConfirmLoading(false);
      setIsVisibleConfirmationModal(false);

      // const currentWalletAsset = await walletService.retrieveDefaultWalletAsset(currentSession);
      // setWalletAsset(currentWalletAsset);

      // const latestLoadedNFTs = await walletService.retrieveNFTs(currentSession.wallet.identifier);
      // setNftList(latestLoadedNFTs);

      form.resetFields();
      setImageUrl('');
      setVideoUrl('');
      setFiles([]);
      setFileType('');
    } catch (e) {
      setErrorMessages(e.message.split(': '));
      setIsVisibleConfirmationModal(false);
      setConfirmLoading(false);
      setInputPasswordVisible(false);
      setIsErrorModalVisible(true);
      // eslint-disable-next-line no-console
      console.log('Error occurred while transfer', e);
    }
  };

  return (
    <>
      <Form
        {...layout}
        layout="vertical"
        form={form}
        name="control-ref"
        onFinish={onWalletDecryptFinish}
        requiredMark={false}
      >
        <Form.Item
          name="denomId"
          label="Denom ID"
          hasFeedback
          validateFirst
          rules={[
            { required: true, message: 'Denom ID is required' },
            {
              min: 3,
              max: 64,
              message: 'Expected length to be between 3 and 64 characters',
            },
            {
              pattern: /^[a-z]/,
              message: 'Denom ID can only start with lowercase alphabetic',
            },
            {
              pattern: /(^[a-z](([a-z0-9]){2,63})$)/,
              message: 'Expected only alphabetic characters or numbers',
            },
          ]}
        >
          <Input maxLength={64} placeholder='e.g. "denomid123"' />
        </Form.Item>
        <Form.Item
          name="name"
          label="Denom Name"
          hasFeedback
          validateFirst
          rules={[{ required: true, message: 'Denom Name is required' }]}
        >
          <Input maxLength={64} placeholder='e.g. "Crypto.org Genesis"' />
        </Form.Item>
        <Form.Item
          name="schema"
          label="Denom Schema"
          hasFeedback
          validateFirst
          rules={[{ required: true, message: 'Denom Schema is required' }]}
        >
          <Radio.Group onChange={(e) => {
            if (e.target.name === "video") {
              setIsVideoSchema(true)
              formValues.schema = JSON.stringify(NFT_VIDEO_DENOM_SCHEMA)
            } else {
              formValues.schema = JSON.stringify(NFT_IMAGE_DENOM_SCHEMA)
            }
          }} defaultValue="image">
            <Radio.Button name="image" value={JSON.stringify(NFT_IMAGE_DENOM_SCHEMA)}>IMAGE</Radio.Button>
            <Radio.Button name="video" value={JSON.stringify(NFT_VIDEO_DENOM_SCHEMA)}>VIDEO</Radio.Button>
            <Radio.Button name="other" value="other" disabled>OTHER</Radio.Button>
          </Radio.Group>
        </Form.Item>
        <ModalPopup
          isModalVisible={isConfirmationModalVisible}
          handleCancel={() => {
            if (!confirmLoading) {
              setIsVisibleConfirmationModal(false);
            }
          }}
          handleOk={() => { setIsErrorModalVisible(false) }}
          footer={[
            <Button
              key="submit"
              type="primary"
              onClick={onNftIssueDenom}
              loading={confirmLoading}
              disabled={isDenomIdIssued && !isDenomIdOwner && (typeof keplr !== "undefined")}
            >
              Confirm
            </Button>,
            <Button
              key="back"
              type="link"
              onClick={() => {
                if (!confirmLoading) {
                  setIsVisibleConfirmationModal(false);
                  setIsErrorModalVisible(false)
                }
              }}
            >
              Cancel
            </Button>,
          ]}
          button={
            <Button htmlType="submit" type="primary" onClick={onNftIssueDenom}>
              Review
            </Button>
          }
          okText="Confirm"
          className="nft-issue-modal"
        >
          <>
            <>
              <div className="title">Confirm NFT Issue Denom</div>
              <div className="description">Please review the information below.</div>

              <div className="item">
                <div className="label">Denom ID</div>
                <div>{`${formValues.denomId}`}</div>
              </div>
              {/* {isDenomIdIssued && !isDenomIdOwner ? ( */}
              {isDenomIdIssued ? (
                <div className="item notice">
                  <Layout>
                    <Sider width="20px">
                      <ExclamationCircleOutlined style={{ color: '#f27474' }} />
                    </Sider>
                    <Content>
                      The Denom ID is registered by another address. Please choose another one.
                    </Content>
                  </Layout>
                </div>
              ) : (
                  ''
                )}
              <div className="item">
                <div className="label">Denom Name</div>
                <div>{`${formValues.name}`}</div>
              </div>
              <div className="item">
                <div className="label">Denom Schema</div>
                <div><Text code>{`${formValues.schema}`}</Text> </div>
              </div>
              <div className="item">
                <div className="label">Transaction Fee</div>
                <div>
                  {parseInt(networkFee, 10) / 1e8} {chainInfoCroeseid3.feeCurrencies[0].coinDenom}
                </div>
              </div>
              {!networkFee ? (
                <div className="item notice">
                  <Layout>
                    <Sider width="20px">
                      <ExclamationCircleOutlined style={{ color: '#f27474' }} />
                    </Sider>
                    <Content>
                      Insufficient balance. Please ensure you have at least{' '}
                      {getUINormalScaleAmount(
                        multiplyFee(networkFee, !isDenomIdIssued ? 2 : 1),
                        walletAsset.decimals,
                      )}{' '}
                      {walletAsset.symbol} for network fee.
                    </Content>
                  </Layout>
                </div>
              ) : (
                  ''
                )}
              <div className="item notice">
                <Layout>
                  <Sider width="20px">
                    <ExclamationCircleOutlined style={{ color: '#1199fa' }} />
                  </Sider>
                  <Content>This NFT Denom will be Issued on the Crypto.org Chain.</Content>
                </Layout>
              </div>
            </>
          </>
        </ModalPopup>
      </Form>
      <SuccessModalPopup
        isModalVisible={isSuccessModalVisible}
        // isModalVisible={true}
        handleCancel={closeSuccessModal}
        handleOk={closeSuccessModal}
        title="Success!"
        button={null}
        footer={[
          <Button key="submit" type="primary" onClick={closeSuccessModal}>
            Ok
          </Button>,
        ]}
      >
        {console.log(broadcastResult)}
        <>
          {
            broadcastResult?.code !== undefined &&
              broadcastResult?.code !== null &&
              broadcastResult.code === walletService.BROADCAST_TIMEOUT_CODE ? (
                <div className="description">
                  The transaction timed out but it will be included in the subsequent blocks
                </div>
              ) : (
                // <div className="description">Your NFT Denom Issue Transaction was broadcasted successfully!</div>
                <div className="description">
                  <Layout>
                    <Sider width="20px">
                      <ExclamationCircleOutlined style={{ color: '#f27474' }} />
                    </Sider>
                    <Content  >
                      Your Issue Denom Tx has been successfully broadcasted: <Link href={`https://crypto.org/explorer/croeseid3/tx/${broadcastResult.transactionHash}`} target="_blank" >{broadcastResult.transactionHash}</Link>
                    </Content>
                  </Layout>
                </div>
              )}
        </>
      </SuccessModalPopup>
      <ErrorModalPopup
        isModalVisible={isErrorModalVisible}
        handleCancel={closeErrorModal}
        handleOk={closeErrorModal}
        title="An error happened!"
        footer={[]}
      >
        <>
          <div className="description">
            The NFT transaction failed. Please try again later.
            <br />
            {errorMessages
              .filter((item, idx) => {
                return errorMessages.indexOf(item) === idx;
              })
              .map((err, idx) => (
                <div key={idx}>- {err}</div>
              ))}
          </div>
        </>
      </ErrorModalPopup>
    </>
  );
};

const NftPage = () => {

  const [keplr, setKeplr] = useState<Keplr>(undefined)
  const [keplrSigner, setKeplrSigner] = useState<string>(undefined)
  const [connectToKeplrClicked, setConnectToKeplrClicked] = useState<boolean>(false)
  const didMountRef = useRef(false);

  const errKeplrConnectNotif = () => {
    notification.open({
      message: 'Keplr Connection',
      description:
        'Please ensure you have `Keplr` extension installed on your browser.',
      icon: <WarningOutlined style={{ color: '#108ee9' }} />,
    });
  };

  const connectionSuccess = () => {
    message.success('Connected with Keplr, Successfully.', 4);
  };

  const handleKeplrConnect = async () => {
    const { chainId } = chainInfoCroeseid3;
    if (document.readyState === "complete" && typeof window.keplr === "undefined") {
      // alert("Please install keplr extension");
      setKeplr(undefined);
      errKeplrConnectNotif()
    }

    if (window.keplr) {
      await window.keplr.experimentalSuggestChain(chainInfoCroeseid3)
      await window.keplr.enable(chainId)
      setKeplr(window.keplr);
      const keplrSignerFirst = (await window.keplr.getOfflineSigner(chainId).getAccounts())[0].address;
      setKeplrSigner(keplrSignerFirst);
      console.log('Keplr from state', keplr)
      console.log('KeplrSigner from state', keplrSigner)
      connectionSuccess()
    }
  }

  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      // analyticsService.logPage('NFT');
    }
  }, [connectToKeplrClicked]);

  return (
    <Layout className="site-layout">
      <Header className="site-layout-background">
        {
          // (typeof keplr === "undefined") ?
          //   (<Button type="ghost" shape="round" size="small" onClick={async () => {
          //     await handleKeplrConnect()
          //     setConnectToKeplrClicked(!connectToKeplrClicked)
          //   }}>
          //     Connect to Keplr
          //   </Button>) : (
          //     <Button type="primary" shape="round" size="small" icon={<CheckCircleOutlined />} color="#ffff">
          //       You are connected ({keplrSigner})
          //     </Button>)
          <Select placeholder="Select your network" style={{ width: "auto" }} onChange={handleKeplrConnect}>
            <Option value="testnet3">TestNetCroeseid3</Option>
            <Option value="testnet2" disabled>TestNetCroeseid2</Option>
            <Option value="mainnet" disabled>Mainnet</Option>
          </Select>
        }

      </Header>

      <div className="header-description">
        An overview of your NFT Collection on Crypto.org Chain.
      </div>
      <Content>
        <Tabs defaultActiveKey="1">
          {/*  MINT NFT PAGE BELOW */}
          <TabPane tab="Mint NFT" key="1" disabled={typeof keplr === "undefined"}>
            <div className="site-layout-background nft-content">
              <div className="container">
                <div className="description">
                  Mint your NFT with Image or Video on Crypto.org chain.
                </div>
                <FormMintNft keplr={keplr} keplrSigner={keplrSigner} />
              </div>
            </div>
          </TabPane>

          {/*  Issue a New Denom PAGE BELOW */}
          <TabPane tab="Issue Denom" key="2" disabled={typeof keplr === "undefined"}>
            <div className="site-layout-background nft-content">
              <div className="container">
                <div className="description">
                  Issue a new denom for your NFT on Crypto.org chain.
                </div>
                <FormIssueDenom keplr={keplr} keplrSigner={keplrSigner} />
              </div>
            </div>
          </TabPane>

        </Tabs>
      </Content>

      <Footer />
    </Layout >
  );
};

export default NftPage;
