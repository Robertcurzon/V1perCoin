import React from 'react';
import { Navigation } from './Navigation';
import { WalletConnect } from './WalletConnect';

interface LayoutProps {
  children: React.ReactNode;
  currentPage: string;
  setCurrentPage: (page: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, currentPage, setCurrentPage }) => {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="border-b border-gray-800">
        <div className="relative h-48">
          <div className="absolute inset-0 overflow-hidden">
            <img 
              src="https://t4.ftcdn.net/jpg/11/79/30/97/360_F_1179309773_IFKBLuVmqnMt3o4ZW1IKYE1lhR3iC2lS.jpg"
              alt="Green Viper"
              className="w-full h-full object-cover object-[center_35%] opacity-60"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-gray-900"></div>
          <div className="absolute bottom-0 left-0 right-0">
            <div className="container mx-auto px-4 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <img 
                    src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTYy11GDJmcp10Jx-jzgqnsrkRLS-95VTLunoOLL78uBSYHUoUH51u5FPeml2OXf3aDfMc&usqp=CAU"
                    alt="VIPER"
                    className="h-10 w-10 rounded-full object-cover ring-2 ring-green-500"
                  />
                  <span className="text-2xl font-bold text-green-500">VIPER</span>
                </div>
                <Navigation currentPage={currentPage} setCurrentPage={setCurrentPage} />
                <WalletConnect />
              </div>
            </div>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
      <footer className="border-t border-gray-800 py-8">
        <div className="container mx-auto px-4 text-center text-gray-400">
          <p>© 2024 Viper. Privacy-First Meme Coin on SUI Blockchain</p>
        </div>
      </footer>
    </div>
  );
}