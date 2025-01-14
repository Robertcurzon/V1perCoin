import React from 'react';

interface NavigationProps {
  currentPage: string;
  setCurrentPage: (page: string) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ currentPage, setCurrentPage }) => {
  const navItems = [
    { id: 'home', label: 'Home' },
    { id: 'community', label: 'Viper Pit' },
    { id: 'about', label: 'About' },
    { id: 'stake', label: 'Stake', inProgress: true },
    { id: 'games', label: 'Games', inProgress: true },
    { id: 'lottery', label: 'Lottery', inProgress: true },
  ];

  return (
    <nav className="hidden md:block">
      <ul className="flex space-x-2">
        {navItems.map((item) => (
          <li key={item.id}>
            <button
              onClick={() => setCurrentPage(item.id)}
              className={`px-3 py-2 rounded-lg transition-colors ${
                currentPage === item.id
                  ? 'bg-green-500 text-white font-bold'
                  : item.inProgress
                  ? 'text-gray-500 hover:text-gray-400 hover:bg-gray-800'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              <div className="flex flex-col items-center">
                <span>{item.label}</span>
                {item.inProgress && (
                  <span className="text-xs text-gray-500 font-normal">
                    In Progress
                  </span>
                )}
              </div>
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}