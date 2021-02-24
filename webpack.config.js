// Copyright 2021 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');

module.exports = {
    entry: './src/index.tsx',

    devtool: 'source-map',
    mode: 'development',

    module: {
        rules: [
            {
                test: /\.js$/,
                use: { loader: 'babel-loader' },
                exclude: /node_modules/,
            },
            {
                test: /\.(ts|tsx)?$/,
                loader: 'awesome-typescript-loader',
                exclude: /node_modules/,
            },
        ]
    },
    resolve: {
        extensions: [ '.ts', '.tsx', '.js', '.json' ]
    },
    output: {
        filename: 'bundle.js',
    },

    devServer: {
        port: 4000,
        open: true,
        hot: true
    },

    plugins: [
        new webpack.EnvironmentPlugin({ 'REACT_APP_API_HOST': '' }),
        new HtmlWebpackPlugin({
            filename: 'index.html',
            template: 'src/index.html',
            hash: true, // This is useful for cache busting
        })
    ]
}
