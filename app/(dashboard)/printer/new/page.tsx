import PrinterForm from '@/components/forms/PrinterForm';

export default function NewPrinterPage() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">새 프린터 등록</h2>
      <PrinterForm mode="create" />
    </div>
  );
}
