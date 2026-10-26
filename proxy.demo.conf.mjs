export default {
  '/api/**': {
    target: 'http://127.0.0.1:' + (process.env.DEMO_API_PORT ?? '5380'),
    secure: false,
    pathRewrite: { '^/api': '' },
  },
};
