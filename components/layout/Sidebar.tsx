'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Sidebar() {
  const pathname = usePathname();

  const menuItems = [
    { name: '대시보드', path: '/dashboard', icon: '📊' },
    { name: 'PC/노트북', path: '/pc', icon: '💻' },
    { name: '서버', path: '/server', icon: '🖥️' },
    { name: '네트워크 IP', path: '/network', icon: '🌐' },
    { name: '프린터', path: '/printer', icon: '🖨️' },
    { name: '소프트웨어', path: '/software', icon: '📦' },
    { name: '보고서', path: '/reports', icon: '📄' },
  ];

  return (
    <aside className="w-64 bg-gray-800 min-h-screen">
      <nav className="mt-5 px-2">
        {menuItems.map((item) => {
          const isActive = pathname.startsWith(item.path);
          return (
            <Link
              key={item.path}
              href={item.path}
              className={`
                group flex items-center px-3 py-2 mb-1 text-sm font-medium rounded-md
                ${isActive
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }
              `}
            >
              <span className="mr-3 text-xl">{item.icon}</span>
              {item.name}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
