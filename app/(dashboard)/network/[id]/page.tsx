import { notFound } from 'next/navigation';
import Link from 'next/link';
import { NetworkIp } from '@/types';
import Button from '@/components/common/Button';
import { getOne, runQuery } from '@/lib/db';

async function getNetworkIp(id: string) {
  try {
    const ip = await getOne<NetworkIp>('SELECT * FROM network_ips WHERE id = ?', [id]);

    if (!ip) return null;

    // Get history
    const history = await runQuery(
      `SELECT h.*, u.name as changed_by_name
       FROM asset_history h
       LEFT JOIN users u ON h.changed_by = u.id
       WHERE h.asset_type = 'network' AND h.asset_id = ?
       ORDER BY h.changed_at DESC
       LIMIT 50`,
      [id]
    );

    return { data: ip, history };
  } catch (error) {
    console.error('Failed to fetch network IP:', error);
    return null;
  }
}

export default async function NetworkDetailPage({ params }: { params: { id: string } }) {
  const result = await getNetworkIp(params.id);

  if (!result || !result.data) {
    notFound();
  }

  const ip: NetworkIp = result.data;
  const history = result.history || [];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">네트워크 IP 상세 정보</h2>
        <div className="space-x-2">
          <Link href="/network">
            <Button variant="secondary">목록</Button>
          </Link>
          <Link href={`/network/${params.id}/edit`}>
            <Button>수정</Button>
          </Link>
        </div>
      </div>

      <div className="space-y-6">
        {/* 네트워크 정보 */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">네트워크 정보</h3>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">IP 주소</dt>
              <dd className="mt-1 text-sm text-gray-900 font-mono">{ip.ip_address}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">서브넷 마스크</dt>
              <dd className="mt-1 text-sm text-gray-900 font-mono">{ip.subnet_mask}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">게이트웨이</dt>
              <dd className="mt-1 text-sm text-gray-900 font-mono">{ip.gateway || '-'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">할당 장비</dt>
              <dd className="mt-1 text-sm text-gray-900">{ip.assigned_device || '-'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">VLAN ID</dt>
              <dd className="mt-1 text-sm text-gray-900">{ip.vlan_id || '-'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">상태</dt>
              <dd className="mt-1">
                <span
                  className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    ip.is_active
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {ip.is_active ? '사용 중' : '미사용'}
                </span>
              </dd>
            </div>
          </dl>
        </div>

        {/* 비고 */}
        {ip.notes && (
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">비고</h3>
            <p className="text-sm text-gray-900 whitespace-pre-wrap">{ip.notes}</p>
          </div>
        )}

        {/* 변경 이력 */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">변경 이력</h3>
          {history.length === 0 ? (
            <p className="text-sm text-gray-500">변경 이력이 없습니다.</p>
          ) : (
            <div className="space-y-4">
              {history.map((item: any) => (
                <div key={item.id} className="border-l-2 border-gray-300 pl-4">
                  <div className="flex justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {item.action === 'create' && '생성'}
                        {item.action === 'update' && '수정'}
                        {item.action === 'delete' && '삭제'}
                      </p>
                      {item.field_name && (
                        <p className="text-xs text-gray-500">
                          {item.field_name}: {item.old_value} → {item.new_value}
                        </p>
                      )}
                    </div>
                    <div className="text-xs text-gray-500">
                      <p>{item.changed_by_name || '알 수 없음'}</p>
                      <p>{new Date(item.changed_at).toLocaleString('ko-KR')}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
