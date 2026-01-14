import PcForm from '@/components/forms/PcForm';

export default function NewPcPage() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">새 PC 등록</h2>
      <PcForm mode="create" />
    </div>
  );
}
