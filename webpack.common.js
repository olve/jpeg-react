const path = require('path')
const webpack = require('webpack')
const CopyWebpackPlugin = require('copy-webpack-plugin')

module.exports = {
    entry: {
      main: './src/index.js',
    },

    output: {
        path: path.join(__dirname, './dist'),
        filename: '[name].bundle.js',
        publicPath: '/'
    },

    module: {
      // use `test` to split a single file
      // or `include` to split a whole folder
      rules: [
        { test: /\.s?css$/,
          use: [
            { loader: 'style-loader'   },
            { loader: 'css-loader'     },
            { loader: 'postcss-loader' }
          ],
          exclude: /node_modules/
        },
        { test: /\.(jpe?g|png|gif)$/i,
          use: [
            { loader: 'file-loader',
              options: {
                hash: 'sha512',
                digest: 'hex',
                name: 'assets/[hash].[ext]'
              },
            },
            { loader: 'image-webpack-loader',
              options: {
                bypassOnDebug: true,
                optimizationLevel: 7,
                interlaced: false,
              }
            }
          ],
          exclude: /node_modules/
        },
        { test: /\.jsx?$/,
          loader: 'babel-loader',
          options: {
            cacheDirectory: true,
            presets: [
              ['env', {
                modules: false,
                targets: {
                  'browsers': ['last 2 versions']
                }
              }],
              'stage-0',
              'react'
            ],
            plugins: [
              'transform-runtime',
              'react-hot-loader/babel',
            ]
          },
          exclude: /node_modules/
        },
        { test: /\.html$/,
          loader: 'file-loader',
          options: {
            name: '[name].[ext]'
          },
          exclude: /node_modules/
        },
        { test: /\.worker\.js$/,
          loader: 'worker-loader',
          exclude: /node_modules/
        },
        { test: /\.(eot|woff)$/i,
          loader: 'file-loader',
          options: {
            hash: 'sha512',
            digest: 'hex',
            name: 'assets/[hash].[ext]'
          },
          exclude: /node_modules/
        },
      ]
    },

    resolve: {
        extensions: ['.js', '.jsx']
    },

    plugins: [
        new CopyWebpackPlugin([
          { from: './src/index.html' },
          { from: './src/assets/meta' },
          { from: './src/assets/static', to: 'static/'}
        ]),
        new webpack.HotModuleReplacementPlugin(),
        new webpack.NamedModulesPlugin(),
        new webpack.SourceMapDevToolPlugin(),
        new webpack.optimize.CommonsChunkPlugin({
          name: 'vendor',
          filename: 'vendor.bundle.js'
        }),
        new webpack.DefinePlugin({
          'process.env.ENV_NAME': JSON.stringify(process.env.ENV_NAME),
        })
     ],
}
