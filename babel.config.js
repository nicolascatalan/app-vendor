module.exports = function (api) {
  api.cache(true);

  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./'],
          alias: {
            '@': './',
            '@components': './components',
            '@hooks': './hooks',
            '@services': './services',
            '@store': './store',
            '@data': './data',
          },
          extensions: ['.ts', '.tsx', '.js', '.json'],
        },
      ],
      'react-native-reanimated/plugin',
    ],
  };
};
