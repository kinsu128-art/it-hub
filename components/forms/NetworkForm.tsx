'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { NetworkIp } from '@/types';
import Button from '@/components/common/Button';
import { isValidIp } from '@/lib/validation/ipValidator';

interface NetworkFormProps {
  ip?: NetworkIp;
  mode: 'create' | 'edit';
}

export default function NetworkForm({ ip, mode }: NetworkFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [ipError, setIpError] = useState('');
  const [formData, setFormData] = useState({
    ip_address: ip?.ip_address || '',
    subnet_mask: ip?.subnet_mask || '255.255.255.0',
    gateway: ip?.gateway || '',
    assigned_device: ip?.assigned_device || '',
    vlan_id: ip?.vlan_id?.toString() || '',
    is_active: ip?.is_active !== undefined ? ip.is_active : true,
    notes: ip?.notes || '',
  });

  // IP 중복 체크 (디바운스)
  useEffect(() => {
    if (!formData.ip_address || formData.ip_address === ip?.ip_address) {
      setIpError('');
      return;
    }

    const timer = setTimeout(async () => {
      if (!isValidIp(formData.ip_address)) {
        setIpError('유효하지 않은 IP 주소 형식입니다.');
        return;
      }

      try {
        const response = await fetch('/api/network/check-duplicate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ip_address: formData.ip_address,
            excludeId: ip?.id || 0,
          }),
        });

        const data = await response.json();

        if (data.isDuplicate) {
          setIpError(`이미 사용 중인 IP입니다. (할당: ${data.existingDevice})`);
        } else {
          setIpError('');
        }
      } catch (error) {
        console.error('IP duplicate check error:', error);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [formData.ip_address, ip?.ip_address, ip?.id]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData({ ...formData, [name]: checked });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (ipError) {
      alert('IP 주소를 확인해주세요.');
      return;
    }

    setLoading(true);

    try {
      const url = mode === 'create' ? '/api/network' : `/api/network/${ip?.id}`;
      const method = mode === 'create' ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          vlan_id: formData.vlan_id ? parseInt(formData.vlan_id) : null,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert(mode === 'create' ? '등록되었습니다.' : '수정되었습니다.');
        router.push('/network');
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
        <h3 className="text-lg font-medium text-gray-900 mb-4">네트워크 정보</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              IP 주소 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="ip_address"
              value={formData.ip_address}
              onChange={handleChange}
              required
              placeholder="예: 192.168.1.100"
              className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 ${
                ipError
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-gray-300 focus:ring-blue-500'
              }`}
            />
            {ipError && (
              <p className="mt-1 text-sm text-red-600">{ipError}</p>
            )}
            {!ipError && formData.ip_address && isValidIp(formData.ip_address) && (
              <p className="mt-1 text-sm text-green-600">✓ 사용 가능한 IP 주소입니다.</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              서브넷 마스크 <span className="text-red-500">*</span>
            </label>
            <select
              name="subnet_mask"
              value={formData.subnet_mask}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="255.255.255.0">/24 (255.255.255.0)</option>
              <option value="255.255.255.128">/25 (255.255.255.128)</option>
              <option value="255.255.255.192">/26 (255.255.255.192)</option>
              <option value="255.255.255.224">/27 (255.255.255.224)</option>
              <option value="255.255.255.240">/28 (255.255.255.240)</option>
              <option value="255.255.255.248">/29 (255.255.255.248)</option>
              <option value="255.255.255.252">/30 (255.255.255.252)</option>
              <option value="255.255.0.0">/16 (255.255.0.0)</option>
              <option value="255.0.0.0">/8 (255.0.0.0)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              게이트웨이
            </label>
            <input
              type="text"
              name="gateway"
              value={formData.gateway}
              onChange={handleChange}
              placeholder="예: 192.168.1.1"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              할당 장비
            </label>
            <input
              type="text"
              name="assigned_device"
              value={formData.assigned_device}
              onChange={handleChange}
              placeholder="예: web-server-01"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              VLAN ID
            </label>
            <input
              type="number"
              name="vlan_id"
              value={formData.vlan_id}
              onChange={handleChange}
              placeholder="예: 10"
              min="1"
              max="4094"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              name="is_active"
              checked={formData.is_active}
              onChange={handleChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label className="ml-2 block text-sm text-gray-900">
              사용 중
            </label>
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
        <Button type="submit" disabled={loading || !!ipError}>
          {loading ? '처리중...' : mode === 'create' ? '등록' : '수정'}
        </Button>
      </div>
    </form>
  );
}
