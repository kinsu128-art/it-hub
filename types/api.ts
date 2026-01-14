export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ListQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  department?: string;
  sort?: string;
  order?: 'asc' | 'desc';
}
