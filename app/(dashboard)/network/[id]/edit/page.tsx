import { notFound } from 'next/navigation';
import NetworkForm from '@/components/forms/NetworkForm';
import { NetworkIp } from '@/types';
import { getOne } from '@/lib/db';

async function getNetworkIp(id: string) {
  try {
    const ip = await getOne<NetworkIp>('SELECT * FROM network_ips WHERE id = ?', [id]);

    if (!ip) return null;

    // Convert all Date fields to string
    const serializedIp = {
      ...ip,
      created_at: typeof (ip.created_at as any)?.toISOString === 'function' ? (ip.created_at as any).toISOString() : ip.created_at,
      updated_at: typeof (ip.updated_at as any)?.toISOString === 'function' ? (ip.updated_at as any).toISOString() : ip.updated_at,
    };

    return serializedIp;
  } catch (error) {
    console.error('Failed to fetch network IP:', error);
    return null;
  }
}

export default async function EditNetworkPage({ params }: { params: { id: string } }) {
  const ip: NetworkIp | null = await getNetworkIp(params.id);

  if (!ip) {
    notFound();
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">네트워크 IP 수정</h2>
      <NetworkForm ip={ip} mode="edit" />
    </div>
  );
}
