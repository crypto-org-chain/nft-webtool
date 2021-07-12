import React, { useState, useEffect, useRef } from 'react';
import './welcome.less';
import 'antd/dist/antd.css';
import { Button } from 'antd';
import { Link, useHistory } from 'react-router-dom';
import { PlusCircleOutlined } from '@ant-design/icons';
import logo from '../../assets/logo-products-chain.svg';
import keplr from '../../assets/image2vector.svg';

function WelcomePage() {

  useEffect(() => {
  }, []);


  return (
    <main className="welcome-page">
      <div className="header">
        <img src={logo} className="logo" alt="logo" />
      </div>
      <div className="container">
        <div>
          <div className="title">Crypto.org Chain NFT Manager</div>
          <div className="slogan">
            This webtool allows you to manage your NFT using  <img src={keplr} className="logo" alt="logo" height="12%" width="12%" />
          </div>
          <div className="button-container">
            <Link to="/nft">
              <Button type="primary">Get Started</Button>
            </Link>
            {/* <Link to="/create">
              <Button>Create Wallet</Button>
            </Link> */}
          </div>
        </div>
      </div>
    </main>
  );
}

export default WelcomePage;
