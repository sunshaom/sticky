import path from 'path';
import babel from '@rollup/plugin-babel';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import replace from '@rollup/plugin-replace';
import typescript from 'rollup-plugin-typescript2';
import chalk from 'chalk';

const pkg = require('./package.json');
const { author, version } = pkg;

const GlobalName = 'Sticky';

const banner = `/*!
  * ${pkg.name} v${version}
  * (c) ${new Date().getFullYear()}
  * author: ${author}
  * @license MIT
  */`;

const outputConfigs = {
  // format: `dist/index.${format}.js`
  cjs: {
    file: pkg.main,
    format: `cjs`
  },
  global: {
    file: pkg.unpkg,
    format: `iife`
  },
  esm: {
    file: pkg.module,
    format: `esm`
  },
  umd: {
    file: pkg.browser,
    format: 'umd',
    name: GlobalName
  }
};

const packageFormats = Object.keys(outputConfigs);

const packageConfigs = packageFormats.map(format => createConfig(format, outputConfigs[format]));

if (process.env.NODE_ENV === 'production') {
  packageFormats.forEach(format => {
    if ('umd' === format) {
      packageConfigs.push(createMinifiedConfig(format));
    }
  });
}

export default packageConfigs;

function createConfig(format, output, plugins = []) {
  if (!output) {
    console.log(chalk.yellow(`invalid format: "${format}"`));
    process.exit(1);
  }

  output.banner = banner;
  // http://rollupjs.org/guide/en/#outputexternallivebindings
  output.externalLiveBindings = false;

  const isGlobalBuild = format === 'global';

  if (isGlobalBuild) output.name = GlobalName;

  const tsPlugin = typescript({
    check: true,
    tsconfig: path.resolve(__dirname, 'tsconfig.json'),
    tsconfigOverride: {}
  });

  return {
    input: `src/index.ts`,
    plugins: [
      tsPlugin,
      ...plugins,
      json(),
      resolve(),
      replace({
        'process.env.__VERSION__': JSON.stringify(`${version}`)
      }),
      commonjs(),
      babel({
        exclude: 'node_modules/**',
        extensions: ['.ts']
      })
    ],
    output
  };
}

function createMinifiedConfig(format) {
  const { terser } = require('rollup-plugin-terser');
  return createConfig(
    format,
    {
      file: outputConfigs[format].file.replace(/\.js$/, '.min.js'),
      format: outputConfigs[format].format,
      name: GlobalName
    },
    [terser()]
  );
}
