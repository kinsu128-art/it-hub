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
  const [searchingSpecs, setSearchingSpecs] = useState(false);
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

  const handleModelNameBlur = async () => {
    if (!formData.model_name.trim()) {
      return;
    }

    // 이미 사양정보가 있으면 다시 검색하지 않음
    if (formData.cpu || formData.ram || formData.disk) {
      return;
    }

    setSearchingSpecs(true);

    try {
      const response = await fetch('/api/pc/search-specs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          modelName: formData.model_name,
        }),
      });

      if (response.ok) {
        const specs = await response.json();
        setFormData((prev) => ({
          ...prev,
          cpu: specs.cpu || '',
          ram: specs.ram || '',
          disk: specs.disk || '',
        }));
      }
    } catch (error) {
      console.error('Error searching specs:', error);
      // 에러가 발생해도 조용히 처리 (사용자 입력을 방해하지 않음)
    } finally {
      setSearchingSpecs(false);
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
              {searchingSpecs && <span className="text-blue-500 text-xs ml-2">검색 중...</span>}
            </label>
            <input
              type="text"
              name="model_name"
              value={formData.model_name}
              onChange={handleChange}
              onBlur={handleModelNameBlur}
              required
              disabled={searchingSpecs}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:cursor-wait"
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
