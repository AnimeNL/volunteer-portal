// Copyright 2021 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

const path = require('path');
const webpack = require('webpack');

const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

// Whether the WebPack configuration should run in production mode.
const prod = true;//process.env.NODE_ENV === 'production';

module.exports = {
    entry: './src/index.tsx',

    devtool: 'source-map',
    mode: prod ? 'production' : 'development',

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

    optimization: {
        splitChunks: {
            cacheGroups: {
                commons: {
                    test: /[\\/]node_modules[\\/]/i,
                    name: 'vendors',
                    chunks: 'all'
                }
            }
        }
    },

    output: {
        filename: prod ? '[name].[chunkhash:8].js' : '[name].js',
        path: path.resolve(__dirname, 'dist'),
    },

    devServer: {
        port: 4000,
        open: true,
        hot: true
    },

    plugins: [
        new webpack.EnvironmentPlugin({ 'REACT_APP_API_HOST': '' }),

        new CleanWebpackPlugin(),
        new HtmlWebpackPlugin({
            filename: 'index.html',
            template: 'src/index.html',
            hash: true, // This is useful for cache busting
        })
    ],
}
