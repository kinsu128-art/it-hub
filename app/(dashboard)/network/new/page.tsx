import NetworkForm from '@/components/forms/NetworkForm';

export default function NewNetworkPage() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">새 IP 등록</h2>
      <NetworkForm mode="create" />
    </div>
  );
}
