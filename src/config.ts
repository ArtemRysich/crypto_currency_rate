export default () => {
  console.log(process.env.REDIS_HOST);
  const redis = {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
  };

  return redis;
};
 