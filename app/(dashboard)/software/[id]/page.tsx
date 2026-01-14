import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Software } from '@/types';
import Button from '@/components/common/Button';
import DisposeButton from '@/components/common/DisposeButton';
import { SOFTWARE_STATUS, SOFTWARE_STATUS_COLORS } from '@/lib/utils/constants';
import { format } from 'date-fns';
import { getOne, runQuery } from '@/lib/db';

async function getSoftware(id: string) {
  try {
    const software = await getOne<Software>('SELECT * FROM software WHERE id = ?', [id]);

    if (!software) return null;

    // Get history
    const history = await runQuery(
      `SELECT h.*, u.name as changed_by_name
       FROM asset_history h
       LEFT JOIN users u ON h.changed_by = u.id
       WHERE h.asset_type = 'software' AND h.asset_id = ?
       ORDER BY h.changed_at DESC
       LIMIT 50`,
      [id]
    );

    return { data: software, history };
  } catch (error) {
    console.error('Failed to fetch software:', error);
    return null;
  }
}

export default async function SoftwareDetailPage({ params }: { params: { id: string } }) {
  const result = await getSoftware(params.id);

  if (!result || !result.data) {
    notFound();
  }

  const software: Software = result.data;
  const history = result.history || [];

  const availableQuantity = software.purchased_quantity - software.allocated_quantity;
  const usagePercent = (software.allocated_quantity / software.purchased_quantity) * 100;

  // Check if expired
  const isExpired = software.expiry_date && new Date(software.expiry_date) < new Date();
  const daysUntilExpiry = software.expiry_date
    ? Math.ceil((new Date(software.expiry_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">소프트웨어 상세 정보</h2>
        <div className="space-x-2">
          <Link href="/software">
            <Button variant="secondary">목록</Button>
          </Link>
          <Link href={`/software/${params.id}/edit`}>
            <Button>수정</Button>
          </Link>
          <DisposeButton assetType="software" assetId={software.id} assetName={software.software_name} />
        </div>
      </div>

      <div className="space-y-6">
        {/* 라이선스 현황 카드 */}
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
          <h3 className="text-lg font-medium opacity-90 mb-3">라이선스 현황</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm opacity-90">구매 수량</p>
              <p className="text-3xl font-bold">{software.purchased_quantity}</p>
            </div>
            <div>
              <p className="text-sm opacity-90">할당 수량</p>
              <p className="text-3xl font-bold">{software.allocated_quantity}</p>
            </div>
            <div>
              <p className="text-sm opacity-90">사용 가능</p>
              <p className="text-3xl font-bold">{availableQuantity}</p>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span>사용률</span>
              <span>{usagePercent.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-white bg-opacity-30 rounded-full h-2">
              <div
                className="bg-white rounded-full h-2 transition-all"
                style={{ width: `${Math.min(usagePercent, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Expiry Warning */}
        {software.expiry_date && (
          <div
            className={`rounded-lg p-4 ${
              isExpired
                ? 'bg-red-50 border-l-4 border-red-500'
                : daysUntilExpiry && daysUntilExpiry <= 30
                ? 'bg-yellow-50 border-l-4 border-yellow-500'
                : 'bg-blue-50 border-l-4 border-blue-500'
            }`}
          >
            <div className="flex items-center">
              <span className="text-2xl mr-3">
                {isExpired ? '⚠️' : daysUntilExpiry && daysUntilExpiry <= 30 ? '⏰' : 'ℹ️'}
              </span>
              <div>
                <p
                  className={`font-medium ${
                    isExpired
                      ? 'text-red-800'
                      : daysUntilExpiry && daysUntilExpiry <= 30
                      ? 'text-yellow-800'
                      : 'text-blue-800'
                  }`}
                >
                  {isExpired
                    ? '라이선스가 만료되었습니다'
                    : daysUntilExpiry && daysUntilExpiry <= 30
                    ? `라이선스가 ${daysUntilExpiry}일 후 만료됩니다`
                    : `만료일: ${format(new Date(software.expiry_date), 'yyyy-MM-dd')}`}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  만료일: {format(new Date(software.expiry_date), 'yyyy년 MM월 dd일')}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 기본 정보 */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">기본 정보</h3>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">소프트웨어명</dt>
              <dd className="mt-1 text-sm text-gray-900">{software.software_name}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">라이선스 키</dt>
              <dd className="mt-1 text-sm text-gray-900 font-mono">
                {software.license_key || '-'}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">버전</dt>
              <dd className="mt-1 text-sm text-gray-900">{software.version || '-'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">공급사</dt>
              <dd className="mt-1 text-sm text-gray-900">{software.vendor_name || '-'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">상태</dt>
              <dd className="mt-1">
                <span
                  className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    SOFTWARE_STATUS_COLORS[software.status]
                  }`}
                >
                  {SOFTWARE_STATUS[software.status]}
                </span>
              </dd>
            </div>
          </dl>
        </div>

        {/* 비고 */}
        {software.notes && (
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">비고</h3>
            <p className="text-sm text-gray-900 whitespace-pre-wrap">{software.notes}</p>
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
