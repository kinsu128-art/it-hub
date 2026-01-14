import { notFound } from 'next/navigation';
import NetworkForm from '@/components/forms/NetworkForm';
import { NetworkIp } from '@/types';
import { getOne } from '@/lib/db';

async function getNetworkIp(id: string) {
  try {
    const ip = await getOne<NetworkIp>('SELECT * FROM network_ips WHERE id = ?', [id]);
    return ip;
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
