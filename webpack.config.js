// Copyright 2021 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

const path = require('path');
const webpack = require('webpack');

const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
    entry: './src/index.tsx',

    devtool: 'source-map',
    mode: 'development',

    module: {
        rules: [
            {
                test: /\.js$/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-envv'],
                    }
                },
                exclude: /node_modules/,
            },
            {
                test: /\.tsx?$/,
                loader: 'awesome-typescript-loader',
                exclude: /node_modules/,
            },
        ]
    },

    resolve: {
        extensions: [ '.ts', '.tsx', '.js', '.json' ],
        alias: {
            'react': 'preact-compat',
            'react-dom': 'preact-compat',
        }
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
        filename: '[name].[chunkhash:8].js',
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
