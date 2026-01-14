import { notFound } from 'next/navigation';
import SoftwareForm from '@/components/forms/SoftwareForm';
import { Software } from '@/types';
import { getOne } from '@/lib/db';

async function getSoftware(id: string) {
  try {
    const software = await getOne<Software>('SELECT * FROM software WHERE id = ?', [id]);
    return software;
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
