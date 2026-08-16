export const API_ROUTE = {
  AUTH: {
    LOGIN: '/api/v1/auth/login',
    LOGOUT: '/api/v1/auth/logout',
    REFRESH_TOKEN: '/api/v1/auth/refresh-token',
    PROFILE: '/api/v1/auth/profile',
  },
  USER: {
    LIST: '/api/v1/admin/users',
    CREATE: '/api/v1/admin/users',
    GET: '/api/v1/admin/users/:id',
    UPDATE: '/api/v1/admin/users/:id',
    DELETE: '/api/v1/admin/users/:id',
  },
  ROLE: {
    LIST: '/api/v1/admin/roles',
    CREATE: '/api/v1/admin/roles',
    GET: '/api/v1/admin/roles/:id',
    UPDATE: '/api/v1/admin/roles/:id',
    DELETE: '/api/v1/admin/roles/:id',
  },
  PERMISSION: {
    LIST: '/api/v1/admin/permissions',
  },
};
