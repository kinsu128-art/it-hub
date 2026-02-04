import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Server } from '@/types';
import Button from '@/components/common/Button';
import DisposeButton from '@/components/common/DisposeButton';
import { SERVER_STATUS, SERVER_STATUS_COLORS } from '@/lib/utils/constants';
import { getOne, runQuery } from '@/lib/db';

async function getServer(id: string) {
  try {
    const server = await getOne<Server>('SELECT * FROM servers WHERE id = ?', [id]);

    if (!server) return null;

    // Get history
    const historyData = await runQuery(
      `SELECT TOP 50 h.*, u.name as changed_by_name
       FROM asset_history h
       LEFT JOIN users u ON h.changed_by = u.id
       WHERE h.asset_type = 'server' AND h.asset_id = ?
       ORDER BY h.changed_at DESC`,
      [id]
    );

    // Fully serialize everything through JSON to remove all Date objects
    const result = JSON.parse(JSON.stringify({
      data: server,
      history: historyData || [],
    }));

    // Format dates after JSON serialization
    const formattedHistory = (result.history || []).map((item: any) => ({
      ...item,
      changed_at: item.changed_at
        ? new Date(item.changed_at).toLocaleString('ko-KR')
        : '',
    }));

    return { data: result.data, history: formattedHistory };
  } catch (error) {
    console.error('Failed to fetch server:', error);
    return null;
  }
}

export default async function ServerDetailPage({ params }: { params: { id: string } }) {
  const result = await getServer(params.id);

  if (!result || !result.data) {
    notFound();
  }

  const server: Server = result.data;
  const history = result.history || [];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">서버 상세 정보</h2>
        <div className="space-x-2">
          <Link href="/server">
            <Button variant="secondary">목록</Button>
          </Link>
          <Link href={`/server/${params.id}/edit`}>
            <Button>수정</Button>
          </Link>
          <DisposeButton assetType="server" assetId={server.id} assetName={server.hostname} />
        </div>
      </div>

      <div className="space-y-6">
        {/* 기본 정보 */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">기본 정보</h3>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">자산번호</dt>
              <dd className="mt-1 text-sm text-gray-900">{server.asset_number}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">호스트명</dt>
              <dd className="mt-1 text-sm text-gray-900">{server.hostname}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">랙 위치</dt>
              <dd className="mt-1 text-sm text-gray-900">{server.rack_location || '-'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">IP 주소</dt>
              <dd className="mt-1 text-sm text-gray-900">{server.ip_address || '-'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">OS 버전</dt>
              <dd className="mt-1 text-sm text-gray-900">{server.os_version || '-'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">용도</dt>
              <dd className="mt-1 text-sm text-gray-900">{server.purpose || '-'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">보증 기간</dt>
              <dd className="mt-1 text-sm text-gray-900">{server.warranty_expiry || '-'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">상태</dt>
              <dd className="mt-1">
                <span
                  className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    SERVER_STATUS_COLORS[server.status]
                  }`}
                >
                  {SERVER_STATUS[server.status]}
                </span>
              </dd>
            </div>
          </dl>
        </div>

        {/* 사양 정보 */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">사양 정보</h3>
          <dl className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">CPU</dt>
              <dd className="mt-1 text-sm text-gray-900">{server.cpu || '-'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">RAM</dt>
              <dd className="mt-1 text-sm text-gray-900">{server.ram || '-'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">디스크</dt>
              <dd className="mt-1 text-sm text-gray-900">{server.disk || '-'}</dd>
            </div>
          </dl>
        </div>

        {/* 비고 */}
        {server.notes && (
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">비고</h3>
            <p className="text-sm text-gray-900 whitespace-pre-wrap">{server.notes}</p>
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
                        {item.action === 'dispose' && '폐기'}
                      </p>
                      {item.field_name && (
                        <p className="text-xs text-gray-500">
                          {item.field_name}: {item.old_value} → {item.new_value}
                        </p>
                      )}
                    </div>
                    <div className="text-xs text-gray-500">
                      <p>{item.changed_by_name || '알 수 없음'}</p>
                      <p>{item.changed_at}</p>
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
