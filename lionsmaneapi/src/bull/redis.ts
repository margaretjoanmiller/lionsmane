export const redisConfig = {
  host: process.env.VALKEY_HOST || 'localhost',
  port: parseInt(process.env.VALKEY_PORT || '6379', 10),
};
