const path = require('path')
const fs = require('fs')
const WebpackObfuscator = require('webpack-obfuscator')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const TerserPlugin = require('terser-webpack-plugin')

function getAllJsFiles(dir, fileList = {}) {
  const files = fs.readdirSync(dir)

  files.forEach(file => {
    const filePath = path.join(dir, file)
    const stat = fs.statSync(filePath)

    if (stat.isDirectory()) {
      getAllJsFiles(filePath, fileList)
    } else if (file.endsWith('.js')) {
      // scripts 이후의 경로를 entry key로 사용
      const entryKey = path.relative(path.join(__dirname, 'scripts'), filePath).replace('.js', '')

      // 경로 구분자를 항상 '/'로 통일
      fileList[entryKey.split(path.sep).join('/')] = './' + path.relative(__dirname, filePath).split(path.sep).join('/')
    }
  })

  return fileList
}

const entryPoints = getAllJsFiles(path.join(__dirname, 'scripts'))

const obfuscatorConfig = JSON.parse(fs.readFileSync(path.join(__dirname, 'obfuscator.config.json'), 'utf-8'))

module.exports = {
  mode: 'production',
  entry: entryPoints,
  output: {
    path: path.resolve(__dirname, 'dist/scripts'),
    filename: '[name].js',
  },
  resolve: {
    extensions: ['.js', '.mjs'],
    fallback: {
      fs: false,
      stream: false,
      crypto: false,
    },
  },
  module: {
    rules: [
      {
        test: /\.(js|mjs)$/,
        exclude: /node_modules\/(?!html2canvas)/, // html2canvas는 번들링에 포함
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
            plugins: ['@babel/plugin-proposal-class-properties', '@babel/plugin-transform-runtime'],
          },
        },
      },
    ],
  },
  plugins: [
    // new WebpackObfuscator(obfuscatorConfig, ['background.js']),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: '**/*.html',
          context: path.resolve(__dirname, 'scripts'),
          to: path.resolve(__dirname, 'dist/scripts/[path][name][ext]'),
          noErrorOnMissing: true,
        },
      ],
    }),
  ],
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          format: {
            comments: false,
          },
        },
        extractComments: false,
      }),
    ],
  },
}
