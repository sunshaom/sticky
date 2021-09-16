module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        loose: true,
        targets: {
          browsers: ['defaults', 'ie >= 9']
        }
      }
    ],
    '@babel/preset-typescript'
  ]
};
