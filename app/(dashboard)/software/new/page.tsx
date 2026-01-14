import SoftwareForm from '@/components/forms/SoftwareForm';

export default function NewSoftwarePage() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">새 소프트웨어 등록</h2>
      <SoftwareForm mode="create" />
    </div>
  );
}
