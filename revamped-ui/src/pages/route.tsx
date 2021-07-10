import React from 'react';
import {
  BrowserRouter,
  Switch,
  Route,
  Redirect,
} from 'react-router-dom';
import HomePage from './home/home';
import NftPage from './nft/nft';
import HomeLayout from '../layouts/home/home';

interface RouterProps {
  children: React.ReactNode;
}

// Electron build: <HashRouter>, Web build: <BrowserRouter>
const Router: React.FC<RouterProps> = props => {
  return (
    <BrowserRouter>{props.children}</BrowserRouter>
  );
};

function RouteHub() {
  const routeIndex = {
    name: 'Welcome Page',
    key: 'nft',
    path: '/',
    component: <NftPage />,
  };

  const routeItems = []

  // const routeItems = [
  //   {
  //     name: 'Welcome Page',
  //     key: 'welcome',
  //     path: '/welcome',
  //     component: <WelcomePage />,
  //   },
  //   {
  //     name: 'Restore Page',
  //     key: 'restore',
  //     path: '/restore',
  //     component: <RestorePage />,
  //   },
  //   {
  //     name: 'Create Page',
  //     key: 'create',
  //     path: '/create',
  //     component: <CreatePage />,
  //   },
  //   {
  //     name: 'Backup Page',
  //     key: 'backup',
  //     path: '/create/backup',
  //     component: <BackupPage />,
  //   },
  //   {
  //     name: 'SignUp Page',
  //     key: 'signUp',
  //     path: '/signUp',
  //     component: <SignUpPage />,
  //   },
  // ];

  const routeHomeLayoutItems = [
    {
      name: 'Nft Page',
      key: 'nft',
      path: '/nft',
      component: <NftPage />,
    },
  ];

  return (
    <Router>
      <Switch>
        <Route exact path={routeIndex.path} key={routeIndex.key}>
          {routeIndex.component}
        </Route>
        {routeItems.map(item => {
          return (
            <Route exact path={item.path} key={item.path}>
              {item.component}
            </Route>
          );
        })}
        <HomeLayout>
          <Switch>
            {routeHomeLayoutItems.map(item => {
              return (
                <Route exact path={item.path} key={item.path}>
                  {item.component}
                </Route>
              );
            })}
            <Route>
              <Redirect to="/" />
            </Route>
          </Switch>
        </HomeLayout>
      </Switch>
    </Router>
  );
}

export default RouteHub;
