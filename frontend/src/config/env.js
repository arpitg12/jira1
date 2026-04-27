const requireEnv = (key) => {
  const value = process.env[key];

  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value;
};

const apiUrl = requireEnv('REACT_APP_API_URL').replace(/\/+$/, '');

export const env = {
  apiUrl,
  uploadsBaseUrl: requireEnv('REACT_APP_UPLOADS_BASE_URL').replace(/\/+$/, ''),
};
