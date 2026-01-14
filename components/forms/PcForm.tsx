'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Pc } from '@/types';
import Button from '@/components/common/Button';

interface PcFormProps {
  pc?: Pc;
  mode: 'create' | 'edit';
}

export default function PcForm({ pc, mode }: PcFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [recognizing, setRecognizing] = useState(false);
  const [recognitionResult, setRecognitionResult] = useState<any>(null);
  const [formData, setFormData] = useState({
    asset_number: pc?.asset_number || '',
    user_name: pc?.user_name || '',
    department: pc?.department || '',
    model_name: pc?.model_name || '',
    serial_number: pc?.serial_number || '',
    purchase_date: pc?.purchase_date || '',
    cpu: pc?.cpu || '',
    ram: pc?.ram || '',
    disk: pc?.disk || '',
    status: pc?.status || 'in_stock',
    notes: pc?.notes || '',
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setRecognizing(true);
      const formDataToSend = new FormData();
      formDataToSend.append('image', file);

      const response = await fetch('/api/pc/recognize-from-image', {
        method: 'POST',
        body: formDataToSend,
      });

      const data = await response.json();

      if (data.success) {
        setRecognitionResult(data.result);
        // 인식된 정보를 폼에 자동으로 입력
        if (data.result.model_name) {
          setFormData(prev => ({
            ...prev,
            model_name: data.result.model_name,
          }));
        }
        if (data.result.cpu) {
          setFormData(prev => ({
            ...prev,
            cpu: data.result.cpu,
          }));
        }
        if (data.result.ram) {
          setFormData(prev => ({
            ...prev,
            ram: data.result.ram,
          }));
        }
        if (data.result.serial_number) {
          setFormData(prev => ({
            ...prev,
            serial_number: data.result.serial_number,
          }));
        }
      } else {
        alert(data.error || '이미지 인식에 실패했습니다.');
      }
    } catch (error) {
      console.error('Image recognition error:', error);
      alert('이미지 인식 중 오류가 발생했습니다.');
    } finally {
      setRecognizing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = mode === 'create' ? '/api/pc' : `/api/pc/${pc?.id}`;
      const method = mode === 'create' ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        alert(mode === 'create' ? '등록되었습니다.' : '수정되었습니다.');
        router.push('/pc');
        router.refresh();
      } else {
        alert(data.error || '오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('Submit error:', error);
      alert('오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 이미지 인식 섹션 (등록 모드에서만 표시) */}
      {mode === 'create' && (
        <div className="bg-blue-50 border border-blue-200 shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">🖼️ PC 라벨 사진으로 빠르게 등록</h3>
          <p className="text-sm text-gray-600 mb-4">
            PC 모델명이 있는 라벨 사진을 업로드하면 AI가 자동으로 모델명, CPU, RAM, 시리얼 번호를 인식합니다.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            <label className="flex-1 flex flex-col items-center justify-center px-4 py-6 bg-white border-2 border-dashed border-blue-300 rounded-lg cursor-pointer hover:border-blue-500 transition">
              <svg className="w-8 h-8 text-blue-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="text-sm font-medium text-gray-700">사진 선택</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={recognizing}
                className="hidden"
              />
            </label>

            {recognizing && (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mb-2"></div>
                  <p className="text-sm text-gray-600">AI가 이미지를 분석 중...</p>
                </div>
              </div>
            )}
          </div>

          {recognitionResult && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded">
              <h4 className="font-medium text-green-900 mb-2">✓ 인식 결과</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                {recognitionResult.model_name && (
                  <p><span className="font-medium">모델명:</span> {recognitionResult.model_name}</p>
                )}
                {recognitionResult.cpu && (
                  <p><span className="font-medium">CPU:</span> {recognitionResult.cpu}</p>
                )}
                {recognitionResult.ram && (
                  <p><span className="font-medium">RAM:</span> {recognitionResult.ram}</p>
                )}
                {recognitionResult.serial_number && (
                  <p><span className="font-medium">시리얼:</span> {recognitionResult.serial_number}</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">기본 정보</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              자산번호 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="asset_number"
              value={formData.asset_number}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              모델명 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="model_name"
              value={formData.model_name}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              시리얼 번호
            </label>
            <input
              type="text"
              name="serial_number"
              value={formData.serial_number}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              도입일
            </label>
            <input
              type="date"
              name="purchase_date"
              value={formData.purchase_date}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              사용자
            </label>
            <input
              type="text"
              name="user_name"
              value={formData.user_name}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              부서
            </label>
            <input
              type="text"
              name="department"
              value={formData.department}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              상태
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="in_stock">재고</option>
              <option value="assigned">지급</option>
              <option value="repair">수리중</option>
              <option value="disposed">폐기</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">사양 정보</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              CPU
            </label>
            <input
              type="text"
              name="cpu"
              value={formData.cpu}
              onChange={handleChange}
              placeholder="예: Intel i7-12700"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              RAM
            </label>
            <input
              type="text"
              name="ram"
              value={formData.ram}
              onChange={handleChange}
              placeholder="예: 16GB DDR4"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              디스크
            </label>
            <input
              type="text"
              name="disk"
              value={formData.disk}
              onChange={handleChange}
              placeholder="예: 512GB SSD"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">비고</h3>
        <textarea
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="추가 정보를 입력하세요..."
        />
      </div>

      <div className="flex justify-end space-x-4">
        <Button
          type="button"
          variant="secondary"
          onClick={() => router.back()}
        >
          취소
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? '처리중...' : mode === 'create' ? '등록' : '수정'}
        </Button>
      </div>
    </form>
  );
}
