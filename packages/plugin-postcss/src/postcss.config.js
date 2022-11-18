export default {
  plugins: [
    (await import('postcss-preset-env')).default
  ]
};