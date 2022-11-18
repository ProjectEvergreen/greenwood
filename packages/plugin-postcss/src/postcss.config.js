export default {
  plugins: [
    (await import('postcss-import')).default,
    (await import('postcss-preset-env')).default
  ]
};