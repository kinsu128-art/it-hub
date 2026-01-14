import { notFound } from 'next/navigation';
import PrinterForm from '@/components/forms/PrinterForm';
import { Printer } from '@/types';
import { getOne } from '@/lib/db';

async function getPrinter(id: string) {
  try {
    const printer = await getOne<Printer>('SELECT * FROM printers WHERE id = ?', [id]);

    if (!printer) return null;

    // Convert all Date fields to string
    const serializedPrinter = {
      ...printer,
      created_at: typeof (printer.created_at as any)?.toISOString === 'function' ? (printer.created_at as any).toISOString() : printer.created_at,
      updated_at: typeof (printer.updated_at as any)?.toISOString === 'function' ? (printer.updated_at as any).toISOString() : printer.updated_at,
    };

    return serializedPrinter;
  } catch (error) {
    console.error('Failed to fetch printer:', error);
    return null;
  }
}

export default async function EditPrinterPage({ params }: { params: { id: string } }) {
  const printer: Printer | null = await getPrinter(params.id);

  if (!printer) {
    notFound();
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">프린터 수정</h2>
      <PrinterForm printer={printer} mode="edit" />
    </div>
  );
}
