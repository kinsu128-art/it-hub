import ServerForm from '@/components/forms/ServerForm';

export default function NewServerPage() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">새 서버 등록</h2>
      <ServerForm mode="create" />
    </div>
  );
}
