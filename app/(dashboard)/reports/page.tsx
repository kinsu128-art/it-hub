'use client';

import { useState, useEffect } from 'react';
import { format, subDays } from 'date-fns';
import * as XLSX from 'xlsx';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
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

export default function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'week' | 'month'>('week');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [useCustomDate, setUseCustomDate] = useState(false);
  const [reportData, setReportData] = useState<any>(null);

  useEffect(() => {
    fetchReport();
  }, [period]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      if (useCustomDate && startDate && endDate) {
        params.append('startDate', startDate);
        params.append('endDate', endDate);
      } else {
        params.append('period', period);
      }

      const response = await fetch(`/api/reports?${params}`);
      const data = await response.json();

      if (data.success) {
        setReportData(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch report:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePeriodChange = (newPeriod: 'week' | 'month') => {
    setPeriod(newPeriod);
    setUseCustomDate(false);
  };

  const handleCustomDateSearch = () => {
    if (!startDate || !endDate) {
      alert('시작일과 종료일을 모두 선택해주세요.');
      return;
    }
    setUseCustomDate(true);
    fetchReport();
  };

  const exportToExcel = () => {
    if (!reportData) return;

    // Create workbook
    const wb = XLSX.utils.book_new();

    // Sheet 1: Summary
    const summaryData = [
      ['자산 유형', '전체', '가동중'],
      ['PC/노트북', reportData.summary.pc.total, reportData.summary.pc.active],
      ['서버', reportData.summary.server.total, reportData.summary.server.active],
      ['프린터', reportData.summary.printer.total, reportData.summary.printer.active],
      ['네트워크 IP', reportData.summary.network.total, reportData.summary.network.active],
      ['소프트웨어', reportData.summary.software.total, reportData.summary.software.active],
    ];
    const ws1 = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, ws1, '자산 현황');

    // Sheet 2: Change History
    const historyData = [
      ['일시', '자산 유형', '작업', '필드', '이전 값', '새 값', '작업자'],
      ...reportData.changes.history.map((item: any) => [
        format(new Date(item.changed_at), 'yyyy-MM-dd HH:mm'),
        ASSET_TYPE_LABELS[item.asset_type] || item.asset_type,
        ACTION_LABELS[item.action] || item.action,
        item.field_name || '-',
        item.old_value || '-',
        item.new_value || '-',
        item.changed_by_name || '알 수 없음',
      ]),
    ];
    const ws2 = XLSX.utils.aoa_to_sheet(historyData);
    XLSX.utils.book_append_sheet(wb, ws2, '변동 내역');

    // Sheet 3: Statistics
    const statsData = [
      ['작업 유형별 통계'],
      ['작업 유형', '건수'],
      ...reportData.changes.byAction.map((item: any) => [
        ACTION_LABELS[item.action] || item.action,
        item.count,
      ]),
      [],
      ['자산 유형별 통계'],
      ['자산 유형', '건수'],
      ...reportData.changes.byAssetType.map((item: any) => [
        ASSET_TYPE_LABELS[item.asset_type] || item.asset_type,
        item.count,
      ]),
    ];
    const ws3 = XLSX.utils.aoa_to_sheet(statsData);
    XLSX.utils.book_append_sheet(wb, ws3, '통계');

    // Generate filename with date
    const filename = `IT자산관리_보고서_${format(new Date(), 'yyyyMMdd_HHmmss')}.xlsx`;

    // Export
    XLSX.writeFile(wb, filename);
  };

  if (loading || !reportData) {
    return <Loading />;
  }

  // Prepare chart data
  const assetSummaryData = [
    { name: 'PC/노트북', total: reportData.summary.pc.total, active: reportData.summary.pc.active },
    { name: '서버', total: reportData.summary.server.total, active: reportData.summary.server.active },
    { name: '프린터', total: reportData.summary.printer.total, active: reportData.summary.printer.active },
    { name: '네트워크 IP', total: reportData.summary.network.total, active: reportData.summary.network.active },
    { name: '소프트웨어', total: reportData.summary.software.total, active: reportData.summary.software.active },
  ];

  const changesByActionData = reportData.changes.byAction.map((item: any) => ({
    name: ACTION_LABELS[item.action] || item.action,
    value: item.count,
  }));

  const changesByAssetTypeData = reportData.changes.byAssetType.map((item: any) => ({
    name: ASSET_TYPE_LABELS[item.asset_type] || item.asset_type,
    value: item.count,
  }));

  const dailyChangesData = reportData.changes.daily.map((item: any) => ({
    date: format(new Date(item.date), 'MM/dd'),
    changes: item.count,
  }));

  const assetTypeChangesSummary = reportData.changes.byAssetType.map((item: any) => ({
    name: ASSET_TYPE_LABELS[item.asset_type] || item.asset_type,
    count: item.count,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">자산 관리 보고서</h2>
        <Button onClick={exportToExcel}>Excel 다운로드</Button>
      </div>

      {/* Period Selector */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">기간 선택</label>
            <div className="flex gap-2">
              <Button
                variant={period === 'week' && !useCustomDate ? 'primary' : 'secondary'}
                onClick={() => handlePeriodChange('week')}
              >
                최근 7일
              </Button>
              <Button
                variant={period === 'month' && !useCustomDate ? 'primary' : 'secondary'}
                onClick={() => handlePeriodChange('month')}
              >
                최근 30일
              </Button>
            </div>
          </div>

          <div className="flex gap-2 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">시작일</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">종료일</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <Button onClick={handleCustomDateSearch}>조회</Button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {assetSummaryData.map((item, index) => (
          <div key={index} className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500 mb-2">{item.name}</h3>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold text-gray-900">{item.total}</p>
              <p className="text-sm text-gray-500">/ 가동 {item.active}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Asset Summary Chart */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">자산 현황</h3>
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

        {/* PC Operating Year Statistics */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">PC/노트북 도입 연차별 현황</h3>
          {reportData.pcByYear && reportData.pcByYear.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={reportData.pcByYear}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" name="대수" fill="#8B5CF6" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-500">
              도입 연차 데이터가 없습니다.
            </div>
          )}
        </div>

        {/* Changes by Action */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">작업 유형별 변동</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={changesByActionData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {changesByActionData.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Changes by Asset Type */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">자산 유형별 변동</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={changesByAssetTypeData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {changesByAssetTypeData.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Daily Changes Trend */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">일별 변동 추이</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dailyChangesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="changes" name="변동 건수" stroke="#3B82F6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Asset Type Changes Summary */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">최근 기간 자산 유형별 변동 요약</h3>
          <div className="space-y-2">
            {assetTypeChangesSummary.length > 0 ? (
              assetTypeChangesSummary.map((item: any) => (
                <div key={item.name} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span className="text-sm font-medium text-gray-700">{item.name}</span>
                  <span className="text-lg font-bold text-blue-600">{item.count}</span>
                </div>
              ))
            ) : (
              <div className="h-[200px] flex items-center justify-center text-gray-500">
                변동 사항이 없습니다.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Change History Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">변동 내역</h3>
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
                  필드
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  변경 내용
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  작업자
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reportData.changes.history.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                    변동 내역이 없습니다.
                  </td>
                </tr>
              ) : (
                reportData.changes.history.map((item: any) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {format(new Date(item.changed_at), 'yyyy-MM-dd HH:mm')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {ASSET_TYPE_LABELS[item.asset_type] || item.asset_type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {ACTION_LABELS[item.action] || item.action}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.field_name || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {item.field_name ? (
                        <span>
                          <span className="text-red-600">{item.old_value || '(없음)'}</span>
                          {' → '}
                          <span className="text-green-600">{item.new_value || '(없음)'}</span>
                        </span>
                      ) : (
                        '-'
                      )}
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
