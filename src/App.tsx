import React, { useState } from 'react';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Stake } from './pages/Stake';
import { Games } from './pages/Games';
import { Lottery } from './pages/Lottery';
import { About } from './pages/About';
import { Community } from './pages/Community';
import { WalletKitProvider } from '@mysten/wallet-kit';
import { WalletProvider } from './contexts/WalletContext';

function App() {
  const [currentPage, setCurrentPage] = useState('home');

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <Home />;
      case 'stake':
        return <Stake />;
      case 'games':
        return <Games />;
      case 'lottery':
        return <Lottery />;
      case 'about':
        return <About />;
      case 'community':
        return <Community />;
      default:
        return <Home />;
    }
  };

  return (
    <WalletKitProvider>
      <WalletProvider>
        <Layout currentPage={currentPage} setCurrentPage={setCurrentPage}>
          {renderPage()}
        </Layout>
      </WalletProvider>
    </WalletKitProvider>
  );
}

export default App;