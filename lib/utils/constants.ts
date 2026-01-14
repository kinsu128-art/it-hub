export const PC_STATUS = {
  assigned: '지급',
  in_stock: '재고',
  repair: '수리중',
  disposed: '폐기',
} as const;

export const PC_STATUS_COLORS = {
  assigned: 'bg-green-100 text-green-800',
  in_stock: 'bg-blue-100 text-blue-800',
  repair: 'bg-yellow-100 text-yellow-800',
  disposed: 'bg-gray-100 text-gray-800',
} as const;

export const SERVER_STATUS = {
  active: '가동중',
  inactive: '비가동',
  maintenance: '유지보수',
  disposed: '폐기',
} as const;

export const SERVER_STATUS_COLORS = {
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-gray-100 text-gray-800',
  maintenance: 'bg-yellow-100 text-yellow-800',
  disposed: 'bg-red-100 text-red-800',
} as const;

export const PRINTER_STATUS = {
  active: '가동중',
  inactive: '비가동',
  repair: '수리중',
  disposed: '폐기',
} as const;

export const PRINTER_STATUS_COLORS = {
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-gray-100 text-gray-800',
  repair: 'bg-yellow-100 text-yellow-800',
  disposed: 'bg-red-100 text-red-800',
} as const;

export const SOFTWARE_STATUS = {
  active: '사용 중',
  expired: '만료됨',
  disposed: '폐기',
} as const;

export const SOFTWARE_STATUS_COLORS = {
  active: 'bg-green-100 text-green-800',
  expired: 'bg-red-100 text-red-800',
  disposed: 'bg-gray-100 text-gray-800',
} as const;
