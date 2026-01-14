import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session.isLoggedIn || !session.user) {
    redirect('/login');
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden w-full">
        <Header user={session.user} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 pt-12 md:pt-0">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
