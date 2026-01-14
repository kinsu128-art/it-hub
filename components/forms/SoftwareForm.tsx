'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Software } from '@/types';
import Button from '@/components/common/Button';

interface SoftwareFormProps {
  software?: Software;
  mode: 'create' | 'edit';
}

export default function SoftwareForm({ software, mode }: SoftwareFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [quantityError, setQuantityError] = useState('');
  const [formData, setFormData] = useState({
    software_name: software?.software_name || '',
    license_key: software?.license_key || '',
    purchased_quantity: software?.purchased_quantity?.toString() || '1',
    allocated_quantity: software?.allocated_quantity?.toString() || '0',
    expiry_date: software?.expiry_date ? software.expiry_date.split('T')[0] : '',
    version: software?.version || '',
    vendor_name: software?.vendor_name || '',
    status: software?.status || 'active',
    notes: software?.notes || '',
  });

  // 할당 수량 검증
  useEffect(() => {
    const purchased = parseInt(formData.purchased_quantity) || 0;
    const allocated = parseInt(formData.allocated_quantity) || 0;

    if (allocated > purchased) {
      setQuantityError('할당 수량은 구매 수량을 초과할 수 없습니다.');
    } else {
      setQuantityError('');
    }
  }, [formData.purchased_quantity, formData.allocated_quantity]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (quantityError) {
      alert('할당 수량을 확인해주세요.');
      return;
    }

    setLoading(true);

    try {
      const url = mode === 'create' ? '/api/software' : `/api/software/${software?.id}`;
      const method = mode === 'create' ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          purchased_quantity: parseInt(formData.purchased_quantity),
          allocated_quantity: parseInt(formData.allocated_quantity),
          expiry_date: formData.expiry_date || null,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert(mode === 'create' ? '등록되었습니다.' : '수정되었습니다.');
        router.push('/software');
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

  const availableQuantity = parseInt(formData.purchased_quantity) - parseInt(formData.allocated_quantity);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">소프트웨어 정보</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              소프트웨어명 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="software_name"
              value={formData.software_name}
              onChange={handleChange}
              required
              placeholder="예: Microsoft Office 365"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              라이선스 키
            </label>
            <input
              type="text"
              name="license_key"
              value={formData.license_key}
              onChange={handleChange}
              placeholder="예: XXXXX-XXXXX-XXXXX-XXXXX"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              구매 수량 <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="purchased_quantity"
              value={formData.purchased_quantity}
              onChange={handleChange}
              required
              min="1"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              할당 수량 <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="allocated_quantity"
              value={formData.allocated_quantity}
              onChange={handleChange}
              required
              min="0"
              className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 ${
                quantityError
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-gray-300 focus:ring-blue-500'
              }`}
            />
            {quantityError && (
              <p className="mt-1 text-sm text-red-600">{quantityError}</p>
            )}
            {!quantityError && (
              <p className="mt-1 text-sm text-gray-500">
                사용 가능: {availableQuantity}개
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              버전
            </label>
            <input
              type="text"
              name="version"
              value={formData.version}
              onChange={handleChange}
              placeholder="예: 2024, v1.0.0"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              만료일
            </label>
            <input
              type="date"
              name="expiry_date"
              value={formData.expiry_date}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              공급사
            </label>
            <input
              type="text"
              name="vendor_name"
              value={formData.vendor_name}
              onChange={handleChange}
              placeholder="예: Microsoft, Adobe"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              상태 <span className="text-red-500">*</span>
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="active">사용 중</option>
              <option value="expired">만료됨</option>
              <option value="disposed">폐기</option>
            </select>
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
        <Button type="submit" disabled={loading || !!quantityError}>
          {loading ? '처리중...' : mode === 'create' ? '등록' : '수정'}
        </Button>
      </div>
    </form>
  );
}
