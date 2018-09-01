const presets = [
  ['@babel/env', {
    // targets are specified in .browserslist
    // run `npx browserslist` will show resultant targets
    useBuiltIns: 'usage'
  }]
];

const plugins = [
];

// these are merged with others
const env = {
  commonjs: {
    plugins: [
      ['@babel/plugin-transform-modules-commonjs', { loose: true }]
    ]
  },
  es: {
    plugins: [
    ]
  },
  test: {
    plugins: [
      ['@babel/plugin-transform-modules-commonjs', { loose: true }],
      'istanbul'
    ]
  }
};

module.exports = {
  env,
  plugins,
  presets,
};
