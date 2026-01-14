import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Pc } from '@/types';
import Button from '@/components/common/Button';
import { PC_STATUS, PC_STATUS_COLORS } from '@/lib/utils/constants';
import { getOne, runQuery } from '@/lib/db';
import DisposeButton from '@/components/common/DisposeButton';

async function getPc(id: string) {
  try {
    const pc = await getOne<Pc>('SELECT * FROM pcs WHERE id = ?', [id]);

    if (!pc) return null;

    // Get history
    const history = await runQuery(
      `SELECT h.*, u.name as changed_by_name
       FROM asset_history h
       LEFT JOIN users u ON h.changed_by = u.id
       WHERE h.asset_type = 'pc' AND h.asset_id = ?
       ORDER BY h.changed_at DESC
       LIMIT 50`,
      [id]
    );

    return { data: pc, history };
  } catch (error) {
    console.error('Failed to fetch PC:', error);
    return null;
  }
}

export default async function PcDetailPage({ params }: { params: { id: string } }) {
  const result = await getPc(params.id);

  if (!result || !result.data) {
    notFound();
  }

  const pc: Pc = result.data;
  const history = (result.history || []).map((item: any) => ({
    ...item,
    changed_at: item.changed_at ? new Date(item.changed_at).toLocaleString('ko-KR') : '',
  }));

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">PC 상세 정보</h2>
        <div className="space-x-2">
          <Link href="/pc">
            <Button variant="secondary">목록</Button>
          </Link>
          <Link href={`/pc/${params.id}/edit`}>
            <Button>수정</Button>
          </Link>
          <DisposeButton assetType="pc" assetId={pc.id} assetName={pc.model_name} />
        </div>
      </div>

      <div className="space-y-6">
        {/* 기본 정보 */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">기본 정보</h3>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">자산번호</dt>
              <dd className="mt-1 text-sm text-gray-900">{pc.asset_number}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">모델명</dt>
              <dd className="mt-1 text-sm text-gray-900">{pc.model_name}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">시리얼 번호</dt>
              <dd className="mt-1 text-sm text-gray-900">{pc.serial_number || '-'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">도입일</dt>
              <dd className="mt-1 text-sm text-gray-900">{pc.purchase_date || '-'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">사용자</dt>
              <dd className="mt-1 text-sm text-gray-900">{pc.user_name || '-'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">부서</dt>
              <dd className="mt-1 text-sm text-gray-900">{pc.department || '-'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">상태</dt>
              <dd className="mt-1">
                <span
                  className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    PC_STATUS_COLORS[pc.status]
                  }`}
                >
                  {PC_STATUS[pc.status]}
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
              <dd className="mt-1 text-sm text-gray-900">{pc.cpu || '-'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">RAM</dt>
              <dd className="mt-1 text-sm text-gray-900">{pc.ram || '-'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">디스크</dt>
              <dd className="mt-1 text-sm text-gray-900">{pc.disk || '-'}</dd>
            </div>
          </dl>
        </div>

        {/* 비고 */}
        {pc.notes && (
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">비고</h3>
            <p className="text-sm text-gray-900 whitespace-pre-wrap">{pc.notes}</p>
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
