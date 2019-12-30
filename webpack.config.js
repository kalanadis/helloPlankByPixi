const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')

module.exports={

    mode: 'development',
    entry: './js/main.js',
    output: {
        filename: 'game.js',
        path: path.resolve(__dirname, 'dist')
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: 'index.html'
        }),
        new CopyWebpackPlugin([
            { from: 'images/*', to: 'images/[name].[ext]' }
        ])
    ]
}

