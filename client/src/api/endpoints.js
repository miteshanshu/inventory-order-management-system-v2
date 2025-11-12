// Central map of backend routes used across the app
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
  },
  PRODUCTS: {
    GET_ALL: '/product',
    GET_BY_ID: (id) => `/product/${id}`,
    CREATE: '/product',
    UPDATE: (id) => `/product/${id}`,
    DELETE: (id) => `/product/${id}`,
  },
  CATEGORIES: {
    GET_ALL: '/category',
    GET_BY_ID: (id) => `/category/${id}`,
    CREATE: '/category',
    UPDATE: (id) => `/category/${id}`,
    DELETE: (id) => `/category/${id}`,
  },
  ORDERS: {
    GET_ALL: '/order',
    GET_BY_ID: (id) => `/order/${id}`,
    CREATE: '/order',
    DELETE: (id) => `/order/${id}`,
  },
  SUPPLIERS: {
    GET_ALL: '/supplier',
    GET_BY_ID: (id) => `/supplier/${id}`,
    CREATE: '/supplier',
    UPDATE: (id) => `/supplier/${id}`,
    DELETE: (id) => `/supplier/${id}`,
  },
};
