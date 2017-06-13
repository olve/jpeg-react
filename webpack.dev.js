const webpack = require('webpack')
const Merge = require('webpack-merge')
const CommonConfig = require('./webpack.common.js')

module.exports = Merge(CommonConfig, {
  devServer: {
      inline: true,
      host: '0.0.0.0',
      port: 8081,
      contentBase: './dist',
      hot: true
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
    })
  ]
})
