import { notFound } from 'next/navigation';
import ServerForm from '@/components/forms/ServerForm';
import { Server } from '@/types';
import { getOne } from '@/lib/db';

async function getServer(id: string) {
  try {
    const server = await getOne<Server>('SELECT * FROM servers WHERE id = ?', [id]);

    if (!server) return null;

    // Convert all Date fields to string
    const serializedServer = {
      ...server,
      created_at: typeof (server.created_at as any)?.toISOString === 'function' ? (server.created_at as any).toISOString() : server.created_at,
      updated_at: typeof (server.updated_at as any)?.toISOString === 'function' ? (server.updated_at as any).toISOString() : server.updated_at,
    };

    return serializedServer;
  } catch (error) {
    console.error('Failed to fetch server:', error);
    return null;
  }
}

export default async function EditServerPage({ params }: { params: { id: string } }) {
  const server: Server | null = await getServer(params.id);

  if (!server) {
    notFound();
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">서버 수정</h2>
      <ServerForm server={server} mode="edit" />
    </div>
  );
}
