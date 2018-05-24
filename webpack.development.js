const Merge = require('webpack-merge')
const CommonConfig = require('./webpack.common.js')
const path = require('path')

module.exports = Merge(CommonConfig, {
  mode: 'development',
  devServer: {
      historyApiFallback: true,
      inline: true,
      host: '0.0.0.0',
      port: 8081,
      contentBase: path.join(__dirname, './dist'),
      hot: true
  }
})
