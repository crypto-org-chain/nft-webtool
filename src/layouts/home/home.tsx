import React, { useEffect, useRef, useState } from 'react';
import './home.less';
import 'antd/dist/antd.css';
import { Button, Form, Layout, Menu, Spin } from 'antd';
import { Link, useHistory, useLocation } from 'react-router-dom';
import Icon, {
  LoadingOutlined,
} from '@ant-design/icons';
import { useRecoilState } from 'recoil';

import {
  sessionState,
  walletAssetState,
  walletListState,
  marketState,
  validatorListState,
  fetchingDBState,
  nftListState,
} from '../../recoil/atom';
import IconNft from '../../svg/IconNft';
import ModalPopup from '../../components/ModalPopup/ModalPopup';
import SuccessModalPopup from '../../components/SuccessModalPopup/SuccessModalPopup';
import packageJson from '../../../package.json';
import { generalConfigService } from '../../storage/GeneralConfigService';

interface HomeLayoutProps {
  children?: React.ReactNode;
}

const { Sider } = Layout;

function HomeLayout(props: HomeLayoutProps) {
  const history = useHistory();
  const [deleteWalletAddress] = useState('');
  const [hasWallet] = useState(true); // Default as true. useEffect will only re-render if result of hasWalletBeenCreated === false
  const [session, setSession] = useRecoilState(sessionState);
  const [userAsset, setUserAsset] = useRecoilState(walletAssetState);
  const [walletList, setWalletList] = useRecoilState(walletListState);
  const [marketData, setMarketData] = useRecoilState(marketState);
  const [validatorList, setValidatorList] = useRecoilState(validatorListState);
  const [nftList, setNftList] = useRecoilState(nftListState);
  const [fetchingDB, setFetchingDB] = useRecoilState(fetchingDBState);
  const [isAnnouncementVisible, setIsAnnouncementVisible] = useState(false);
  const [isSuccessDeleteModalVisible, setIsSuccessDeleteModalVisible] = useState(false);
  const didMountRef = useRef(false);

  useEffect(() => {
    setFetchingDB(false);

    if (!didMountRef.current) {
      didMountRef.current = true;
    }
  }, [
    history,
    hasWallet,
    session,
    setSession,
    userAsset,
    setUserAsset,
    walletList,
    setWalletList,
    marketData,
    setMarketData,
    validatorList,
    setValidatorList,
    nftList,
    setNftList,
  ]);

  const HomeMenu = () => {
    const locationPath = useLocation().pathname;
    const paths = [
      '/welcome',
      // '/staking',
      // '/send',
      // '/receive',
      // '/settings',
      // '/governance',
      '/nft',
      // '/wallet',
    ];

    let menuSelectedKey = locationPath;
    if (!paths.includes(menuSelectedKey)) {
      menuSelectedKey = '/nft';
    }

    return (
      <Menu theme="dark" mode="inline" defaultSelectedKeys={[menuSelectedKey]}>
        <Menu.Item key="/nft" icon={<Icon component={IconNft} />}>
          <Link to="/nft">My NFT</Link>
        </Menu.Item>
      </Menu>
    );
  };

  const buildVersion = packageJson.version;

  return (
    <main className="home-layout">
      <Layout>
        <Sider className="home-sider">
          <div className="logo" />
          <div className="version">NFT MANAGER v{buildVersion}</div>
          <HomeMenu />

        </Sider>
        <div className={`home-page ${fetchingDB ? 'loading' : ''}`}>
          <Spin spinning={fetchingDB} indicator={<LoadingOutlined style={{ fontSize: 96 }} />}>
            <div className="container">{props.children}</div>
          </Spin>
        </div>
        <SuccessModalPopup
          isModalVisible={isSuccessDeleteModalVisible}
          handleCancel={() => {
            setIsSuccessDeleteModalVisible(false);
          }}
          handleOk={() => {
            setIsSuccessDeleteModalVisible(false);
          }}
          title="Success!"
          button={null}
          footer={[
            <Button
              key="submit"
              type="primary"
              onClick={() => {
                setIsSuccessDeleteModalVisible(false);
              }}
            >
              Ok
            </Button>,
          ]}
        >
          <>
            <div className="description">
              Wallet Address
              <br />
              {deleteWalletAddress}
              <br />
              has been deleted.
            </div>
          </>
        </SuccessModalPopup>
        <ModalPopup
          isModalVisible={isAnnouncementVisible}
          handleCancel={() => {
            setIsAnnouncementVisible(false);
            generalConfigService.setHasShownAnalyticsPopup(true);
          }}
          handleOk={() => { }}
          footer={[]}
        >
          <>
            <div className="title">Data analytics was added</div>
            <div className="description">
              You can help improve Crypto.org Chain Wallet by having Data Analytics enabled. The
              data collected will help the development team prioritize new features and improve
              existing functionalities. <br />
              <br />
              You can always come back to disable Data Analytics anytime under General Configuration
              in{' '}
              <Link
                to="/settings"
                onClick={async () => {
                  setIsAnnouncementVisible(false);
                  await generalConfigService.setHasShownAnalyticsPopup(true);
                }}
              >
                Settings
              </Link>
              .
            </div>
          </>
        </ModalPopup>
      </Layout>
    </main>
  );
}

export default HomeLayout;
