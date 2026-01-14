'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import Button from '@/components/common/Button';
import Loading from '@/components/common/Loading';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

const ACTION_LABELS: Record<string, string> = {
  create: '생성',
  update: '수정',
  delete: '삭제',
  dispose: '폐기',
};

const ASSET_TYPE_LABELS: Record<string, string> = {
  pc: 'PC/노트북',
  server: '서버',
  printer: '프린터',
  network: '네트워크 IP',
  software: '소프트웨어',
};

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<any>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/reports?period=week');
      const data = await response.json();

      if (data.success) {
        setDashboardData(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !dashboardData) {
    return <Loading />;
  }

  // Prepare chart data
  const assetSummaryData = [
    {
      name: 'PC/노트북',
      total: dashboardData.summary.pc.total,
      active: dashboardData.summary.pc.active,
      icon: '💻',
      link: '/pc',
    },
    {
      name: '서버',
      total: dashboardData.summary.server.total,
      active: dashboardData.summary.server.active,
      icon: '🖥️',
      link: '/server',
    },
    {
      name: '프린터',
      total: dashboardData.summary.printer.total,
      active: dashboardData.summary.printer.active,
      icon: '🖨️',
      link: '/printer',
    },
    {
      name: '네트워크 IP',
      total: dashboardData.summary.network.total,
      active: dashboardData.summary.network.active,
      icon: '🌐',
      link: '/network',
    },
    {
      name: '소프트웨어',
      total: dashboardData.summary.software.total,
      active: dashboardData.summary.software.active,
      icon: '📦',
      link: '/software',
    },
  ];

  const totalAssets = assetSummaryData.reduce((sum, item) => sum + item.total, 0);
  const totalActive = assetSummaryData.reduce((sum, item) => sum + item.active, 0);

  const changesByAssetTypeData = dashboardData.changes.byAssetType.map((item: any) => ({
    name: ASSET_TYPE_LABELS[item.asset_type] || item.asset_type,
    value: item.count,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">대시보드</h2>
          <p className="text-sm text-gray-500 mt-1">IT 자산 현황 및 최근 변동사항</p>
        </div>
        <Link href="/reports">
          <Button>📊 상세 보고서</Button>
        </Link>
      </div>

      {/* Overall Summary */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium opacity-90">전체 자산 현황</h3>
            <div className="flex items-baseline gap-4 mt-2">
              <div>
                <span className="text-4xl font-bold">{totalAssets}</span>
                <span className="text-xl ml-2">개</span>
              </div>
              <div className="text-sm opacity-90">
                <span>가동중: </span>
                <span className="font-semibold text-lg">{totalActive}</span>
                <span> 개</span>
              </div>
            </div>
          </div>
          <div className="text-6xl opacity-20">📊</div>
        </div>
      </div>

      {/* Asset Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {assetSummaryData.map((item, index) => (
          <Link key={index} href={item.link}>
            <div className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer p-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-gray-500 text-sm font-medium">{item.name}</h3>
                <span className="text-2xl">{item.icon}</span>
              </div>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-bold text-gray-900">{item.total}</p>
                <p className="text-sm text-gray-500">개</p>
              </div>
              <div className="mt-2 flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <p className="text-xs text-gray-600">가동중: {item.active}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Asset Status Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">자산 유형별 현황</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={assetSummaryData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="total" name="전체" fill="#3B82F6" />
              <Bar dataKey="active" name="가동중" fill="#10B981" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Changes Distribution */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            최근 7일 자산 유형별 변동
          </h3>
          {changesByAssetTypeData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={changesByAssetTypeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {changesByAssetTypeData.map((entry: any, index: number) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-500">
              최근 변동사항이 없습니다.
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">빠른 작업</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Link href="/pc/new">
            <Button variant="secondary" className="w-full">
              💻 PC 등록
            </Button>
          </Link>
          <Link href="/server/new">
            <Button variant="secondary" className="w-full">
              🖥️ 서버 등록
            </Button>
          </Link>
          <Link href="/printer/new">
            <Button variant="secondary" className="w-full">
              🖨️ 프린터 등록
            </Button>
          </Link>
          <Link href="/network/new">
            <Button variant="secondary" className="w-full">
              🌐 IP 등록
            </Button>
          </Link>
          <Link href="/software/new">
            <Button variant="secondary" className="w-full">
              📦 소프트웨어 등록
            </Button>
          </Link>
        </div>
      </div>

      {/* Recent Changes */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">최근 변경 사항 (7일)</h3>
          <Link href="/reports">
            <Button variant="secondary" size="sm">
              전체 보기
            </Button>
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  일시
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  자산 유형
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  작업
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  작업자
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {dashboardData.changes.history.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-8 text-center text-sm text-gray-500"
                  >
                    최근 변경 사항이 없습니다.
                  </td>
                </tr>
              ) : (
                dashboardData.changes.history.slice(0, 10).map((item: any) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {format(new Date(item.changed_at), 'MM/dd HH:mm')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {ASSET_TYPE_LABELS[item.asset_type] || item.asset_type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          item.action === 'create'
                            ? 'bg-green-100 text-green-800'
                            : item.action === 'update'
                            ? 'bg-blue-100 text-blue-800'
                            : item.action === 'dispose'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {ACTION_LABELS[item.action] || item.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.changed_by_name || '알 수 없음'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
