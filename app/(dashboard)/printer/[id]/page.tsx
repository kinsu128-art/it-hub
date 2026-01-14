import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Printer } from '@/types';
import Button from '@/components/common/Button';
import DisposeButton from '@/components/common/DisposeButton';
import { PRINTER_STATUS, PRINTER_STATUS_COLORS } from '@/lib/utils/constants';
import { getOne, runQuery } from '@/lib/db';

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

    // Get history
    const historyData = await runQuery(
      `SELECT h.*, u.name as changed_by_name
       FROM asset_history h
       LEFT JOIN users u ON h.changed_by = u.id
       WHERE h.asset_type = 'printer' AND h.asset_id = ?
       ORDER BY h.changed_at DESC
       LIMIT 50`,
      [id]
    );

    // Fully serialize everything through JSON to remove all Date objects
    const result = JSON.parse(JSON.stringify({
      data: serializedPrinter,
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
    console.error('Failed to fetch printer:', error);
    return null;
  }
}

export default async function PrinterDetailPage({ params }: { params: { id: string } }) {
  const result = await getPrinter(params.id);

  if (!result || !result.data) {
    notFound();
  }

  const printer: Printer = result.data;
  const history = result.history || [];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">프린터 상세 정보</h2>
        <div className="space-x-2">
          <Link href="/printer">
            <Button variant="secondary">목록</Button>
          </Link>
          <Link href={`/printer/${params.id}/edit`}>
            <Button>수정</Button>
          </Link>
          <DisposeButton assetType="printer" assetId={printer.id} assetName={printer.model_name} />
        </div>
      </div>

      <div className="space-y-6">
        {/* 기본 정보 */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">기본 정보</h3>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">자산번호</dt>
              <dd className="mt-1 text-sm text-gray-900">{printer.asset_number}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">모델명</dt>
              <dd className="mt-1 text-sm text-gray-900">{printer.model_name}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">IP 주소</dt>
              <dd className="mt-1 text-sm text-gray-900">{printer.ip_address || '-'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">위치</dt>
              <dd className="mt-1 text-sm text-gray-900">{printer.location || '-'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">토너 상태</dt>
              <dd className="mt-1 text-sm text-gray-900">{printer.toner_status || '-'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">드럼 상태</dt>
              <dd className="mt-1 text-sm text-gray-900">{printer.drum_status || '-'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">상태</dt>
              <dd className="mt-1">
                <span
                  className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    PRINTER_STATUS_COLORS[printer.status]
                  }`}
                >
                  {PRINTER_STATUS[printer.status]}
                </span>
              </dd>
            </div>
          </dl>
        </div>

        {/* 공급업체 정보 */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">공급업체 정보</h3>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">공급업체명</dt>
              <dd className="mt-1 text-sm text-gray-900">{printer.vendor_name || '-'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">공급업체 연락처</dt>
              <dd className="mt-1 text-sm text-gray-900">{printer.vendor_contact || '-'}</dd>
            </div>
          </dl>
        </div>

        {/* 비고 */}
        {printer.notes && (
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">비고</h3>
            <p className="text-sm text-gray-900 whitespace-pre-wrap">{printer.notes}</p>
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
