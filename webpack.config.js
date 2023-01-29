// Copyright 2021 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

const childProcess = require('child_process');
const path = require('path');

const webpack = require('webpack');

const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const { GenerateSW } = require('workbox-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MomentLocalesPlugin = require('moment-locales-webpack-plugin');
const MomentTimezoneDataPlugin = require('moment-timezone-data-webpack-plugin');

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
                        presets: ['@babel/preset-typescript'],
                    }
                },
                exclude: /node_modules/,
            },
            {
                test: /\.tsx?$/,
                use: [
                    {
                        loader: 'babel-loader',
                        options: {
                            presets: ['@babel/preset-typescript'],
                            plugins: ['@babel/plugin-proposal-class-properties'],
                        }
                    },
                    {
                        loader: 'ts-loader',
                    }
                ],
                exclude: /node_modules/,
            },
        ]
    },

    resolve: {
        extensions: [ '.ts', '.tsx', '.js' ],
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

        new MomentLocalesPlugin({ localesToKeep: [ 'en-gb' ] }),
        new MomentTimezoneDataPlugin({
            matchZones: /^Europe\//,
            startYear: 2022,
        }),

        new CleanWebpackPlugin(),
        new CopyWebpackPlugin({
            patterns: [
                { from: 'static/**/*', to: '' },

                // Duplicate common image resources to both environments.
                { from: 'static/images/*.*', to: createCopyDestinationFn('static/images/gophers/') },
                { from: 'static/images/*.*', to: createCopyDestinationFn('static/images/hosts/') },
                { from: 'static/images/*.*', to: createCopyDestinationFn('static/images/stewards/') },
            ],
        }),

        ...(
            // Only generate the service worker in production builds. This is because Workbox has
            // some odd way of interacting with emits that's incompatible with the plugin.
            // https://github.com/GoogleChrome/workbox/issues/1790#issuecomment-544982014
            process.env.NODE_PROD === '1'
                ? [ new GenerateSW({
                        clientsClaim: true,
                        skipWaiting: true,

                        navigateFallback: '/index.html',
                        navigateFallbackAllowlist: [
                            /\/schedule\//,
                            /\?app$/,
                        ],

                        runtimeCaching: [
                            {
                                urlPattern: /\/avatars\//,
                                handler: 'CacheFirst',
                                options: {
                                    cacheName: 'vp-avatars',
                                },
                            },
                        ],
                    }) ]
                : []),

        new HtmlWebpackPlugin({
            filename: 'index.html',
            template: 'src/index.html',
            base: '/',  // Enables relative URLs to work painlessly
            hash: false, // Cache busting is enabled through chunk hashes
        }),

        new BundleAnalyzerPlugin({
            analyzerMode: 'static',
            openAnalyzer: false,
            reportFilename: 'index-sizes.html',
        }),
    ],
}
