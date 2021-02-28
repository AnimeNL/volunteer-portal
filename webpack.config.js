// Copyright 2021 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

const childProcess = require('child_process');
const path = require('path');

const webpack = require('webpack');

const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

function createCopyDestinationFn(prefix) {
    return ({ context, absoluteFilename }) =>
        prefix + path.basename(absoluteFilename);
}

function getGitCommitHash() {
    return childProcess.execSync(`git describe --always`, { encoding: 'utf8' }).trim();
}

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
            'react': 'preact/compat',
            'react-dom': 'preact/compat',
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
        historyApiFallback: {
            rewrites: [
                // Rewrites the paths part of the SPA back to index.html
                {
                    from: /^\/registration\/?.*$/,
                    to: '/index.html',
                },

                // Rewrites image requests to the stewards configuration. The actual webserver will
                // rewrite paths based on the hostname, which is included in nginx.conf.
                {
                    from: /^\/images\/.*$/,
                    to: context =>
                        '/static/images/stewards/' + path.basename(context.parsedUrl.pathname)
                }
            ],
        },

        port: 4000,
        open: true,
        hot: true
    },

    plugins: [
        new webpack.EnvironmentPlugin({
            'REACT_APP_API_HOST': '',
            'REACT_APP_GIT_VERSION': getGitCommitHash(),
        }),

        new CleanWebpackPlugin(),

        new CopyWebpackPlugin({
            patterns: [
                { from: 'static/**/*', to: '' },

                // Duplicate common image resources to both environments.
                { from: 'static/images/*.*', to: createCopyDestinationFn('static/images/gophers/') },
                { from: 'static/images/*.*', to: createCopyDestinationFn('static/images/stewards/') },
            ],
        }),

        new HtmlWebpackPlugin({
            filename: 'index.html',
            template: 'src/index.html',
            hash: true, // This is useful for cache busting
        })
    ],
}
