import { notFound } from 'next/navigation';
import SoftwareForm from '@/components/forms/SoftwareForm';
import { Software } from '@/types';
import { getOne } from '@/lib/db';

async function getSoftware(id: string) {
  try {
    const software = await getOne<Software>('SELECT * FROM software WHERE id = ?', [id]);

    if (!software) return null;

    // Convert all Date fields to string
    const serializedSoftware = {
      ...software,
      created_at: typeof (software.created_at as any)?.toISOString === 'function' ? (software.created_at as any).toISOString() : software.created_at,
      updated_at: typeof (software.updated_at as any)?.toISOString === 'function' ? (software.updated_at as any).toISOString() : software.updated_at,
      expiry_date: typeof (software.expiry_date as any)?.toISOString === 'function' ? (software.expiry_date as any).toISOString() : software.expiry_date,
    };

    return serializedSoftware;
  } catch (error) {
    console.error('Failed to fetch software:', error);
    return null;
  }
}

export default async function EditSoftwarePage({ params }: { params: { id: string } }) {
  const software: Software | null = await getSoftware(params.id);

  if (!software) {
    notFound();
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">소프트웨어 수정</h2>
      <SoftwareForm software={software} mode="edit" />
    </div>
  );
}
