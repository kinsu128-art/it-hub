'use client';

import { useRouter } from 'next/navigation';

interface HeaderProps {
  user: {
    name: string;
    role: string;
  };
}

export default function Header({ user }: HeaderProps) {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <h1 className="text-lg sm:text-xl font-bold text-gray-900 truncate">
              디케이락(주) IT 자산관리
            </h1>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-4">
            <div className="hidden sm:block text-sm">
              <span className="text-gray-700 font-medium">{user.name}</span>
              <span className="text-gray-500 ml-2">({user.role})</span>
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-600 text-white px-2 sm:px-4 py-2 rounded hover:bg-red-700 text-xs sm:text-sm whitespace-nowrap"
            >
              로그아웃
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
