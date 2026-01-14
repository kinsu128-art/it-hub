'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Pc } from '@/types';
import Button from '@/components/common/Button';
import Loading from '@/components/common/Loading';
import Pagination from '@/components/common/Pagination';
import { PC_STATUS, PC_STATUS_COLORS } from '@/lib/utils/constants';

export default function PcListPage() {
  const router = useRouter();
  const [pcs, setPcs] = useState<Pc[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchPcs();
  }, [currentPage, statusFilter]);

  const fetchPcs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
      });

      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);

      const response = await fetch(`/api/pc?${params}`);
      const data = await response.json();

      if (data.success) {
        setPcs(data.data);
        setTotal(data.total);
        setTotalPages(data.totalPages);
      }
    } catch (error) {
      console.error('Failed to fetch PCs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchPcs();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('이 PC를 폐기 처리하시겠습니까?')) return;

    try {
      const response = await fetch(`/api/pc/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        alert('폐기 처리되었습니다.');
        fetchPcs();
      } else {
        alert('폐기 처리 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('폐기 처리 중 오류가 발생했습니다.');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">PC/노트북 관리</h2>
        <Link href="/pc/new">
          <Button>+ 새 PC 등록</Button>
        </Link>
      </div>

      {/* 검색 및 필터 */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <form onSubmit={handleSearch} className="flex gap-4">
          <input
            type="text"
            placeholder="자산번호, 모델명, 사용자명, 시리얼 검색..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">전체 상태</option>
            <option value="assigned">지급</option>
            <option value="in_stock">재고</option>
            <option value="repair">수리중</option>
            <option value="disposed">폐기</option>
          </select>
          <Button type="submit">검색</Button>
        </form>
      </div>

      {/* 통계 */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <p className="text-sm text-gray-600">
          총 <span className="font-bold text-blue-600">{total}</span>개의 PC
        </p>
      </div>

      {/* 목록 */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {loading ? (
          <Loading />
        ) : pcs.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            등록된 PC가 없습니다.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      자산번호
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      모델명
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      사용자
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      부서
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      사양
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      상태
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      작업
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pcs.map((pc) => (
                    <tr key={pc.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {pc.asset_number}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {pc.model_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {pc.user_name || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {pc.department || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        <div className="text-xs">
                          {pc.cpu && <div>CPU: {pc.cpu}</div>}
                          {pc.ram && <div>RAM: {pc.ram}</div>}
                          {pc.disk && <div>Disk: {pc.disk}</div>}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            PC_STATUS_COLORS[pc.status]
                          }`}
                        >
                          {PC_STATUS[pc.status]}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link
                          href={`/pc/${pc.id}`}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          상세
                        </Link>
                        <Link
                          href={`/pc/${pc.id}/edit`}
                          className="text-green-600 hover:text-green-900 mr-3"
                        >
                          수정
                        </Link>
                        <button
                          onClick={() => handleDelete(pc.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          폐기
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
