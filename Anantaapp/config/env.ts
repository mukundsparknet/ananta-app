export const ENV = {
  API_BASE_URL: 'https://admin.anantalive.com',
  AGORA_APP_ID: '188a8077960b4ea08c2ee25b028c8f3a',
};

export const getApiUrl = (endpoint: string) => {
  return `${ENV.API_BASE_URL}${endpoint}`;
};
