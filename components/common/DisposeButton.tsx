'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from './Button';

interface DisposeButtonProps {
  assetType: 'pc' | 'server' | 'network' | 'printer' | 'software';
  assetId: number;
  assetName: string;
}

export default function DisposeButton({ assetType, assetId, assetName }: DisposeButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleDispose = async () => {
    if (!window.confirm(`정말로 "${assetName}"을(를) 폐기 처리하시겠습니까?`)) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/${assetType}/${assetId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        alert('폐기 처리되었습니다.');
        router.push(`/${assetType}`);
        router.refresh();
      } else {
        const data = await response.json();
        alert(data.error || '폐기 처리에 실패했습니다.');
      }
    } catch (error) {
      console.error('Dispose error:', error);
      alert('폐기 처리 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="danger"
      onClick={handleDispose}
      disabled={loading}
    >
      {loading ? '처리 중...' : '🗑️ 폐기'}
    </Button>
  );
}
