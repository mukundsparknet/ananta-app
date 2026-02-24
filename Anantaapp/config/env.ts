export const ENV = {
  API_BASE_URL: 'https://ecofuelglobal.com',
};

export const getApiUrl = (endpoint: string) => {
  return `${ENV.API_BASE_URL}${endpoint}`;
};
