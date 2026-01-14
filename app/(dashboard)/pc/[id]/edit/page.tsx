import { notFound } from 'next/navigation';
import PcForm from '@/components/forms/PcForm';
import { Pc } from '@/types';
import { getOne } from '@/lib/db';

async function getPc(id: string) {
  try {
    const pc = await getOne<Pc>('SELECT * FROM pcs WHERE id = ?', [id]);

    if (!pc) return null;

    // Convert all Date fields to string
    const serializedPc = {
      ...pc,
      created_at: typeof (pc.created_at as any)?.toISOString === 'function' ? (pc.created_at as any).toISOString() : pc.created_at,
      updated_at: typeof (pc.updated_at as any)?.toISOString === 'function' ? (pc.updated_at as any).toISOString() : pc.updated_at,
      purchase_date: typeof (pc.purchase_date as any)?.toISOString === 'function' ? (pc.purchase_date as any).toISOString() : pc.purchase_date,
    };

    return serializedPc;
  } catch (error) {
    console.error('Failed to fetch PC:', error);
    return null;
  }
}

export default async function EditPcPage({ params }: { params: { id: string } }) {
  const pc: Pc | null = await getPc(params.id);

  if (!pc) {
    notFound();
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">PC 수정</h2>
      <PcForm pc={pc} mode="edit" />
    </div>
  );
}
