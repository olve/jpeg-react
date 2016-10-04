const path = require('path')
const webpack = require('webpack')

module.exports = {
    context: path.join(__dirname, './src'),

    entry: {
        app: './index.jsx',
        vendor: ['react'],
    },

    output: {
        path: path.join(__dirname, './dist'),
        filename: '[name].bundle.js'
    },

    module: {
        loaders: [{
            test: /\.html$/,
            loader: 'file?name=[name].[ext]',
            exclude: /node_modules/
        }, {
            test: /\.jsx?$/,
            loaders: ['react-hot', 'babel?presets[]=react,presets[]=es2015&presets[]=stage-0&plugins[]=transform-decorators-legacy'],
            exclude: /node_modules/
        }, {
            test: /\.(eot|woff)$/i,
            loaders: ['file?hash=sha512&digest=hex&name=assets/[hash].[ext]']
        }, {
            test: /\.css$/,
            exclude: /node_modules/,
            loaders: [
                'style-loader',
                'css-loader?modules&importLoaders=1&localIdentName=[name]__[local]___[hash:base64:5]',
            ]
        }, {
            loader: 'worker',
            test: /\.worker\.js$/
        }, {
            test: /\.(jpe?g|png|gif)$/i,
            loaders: [
                'file?hash=sha512&digest=hex&name=assets/[hash].[ext]',
                'image-webpack?bypassOnDebug&optimizationLevel=7&interlaced=false'
            ]
        }]
    },

    resolve: {
        extensions: ['', '.js', '.jsx']
        // modulesDirectories: ['node''app']
    },

    plugins: [
        new webpack.SourceMapDevToolPlugin(),
        new webpack.optimize.CommonsChunkPlugin('vendor', 'vendor.bundle.js'),
     ],

    devServer: {
        contentBase: './dist',
        hot: true
    }

}
