var path = require('path');
var webpack = require("webpack");
var ExtractTextPlugin = require('extract-text-webpack-plugin');

var extractPopup = new ExtractTextPlugin('popup.css');
var extractOptions = new ExtractTextPlugin('options.css');
var extractContent = new ExtractTextPlugin('content.css');

var plugins = [
  extractPopup,
  extractOptions,
  extractContent
];

var isRelease = process.argv.indexOf('--release') > 0;

if (isRelease) {
  plugins.push(new webpack.optimize.UglifyJsPlugin({
    mangle: true,
    compress: {
      sequences: true,
      dead_code: true,
      conditionals: true,
      booleans: true,
      // unused: true,
      if_return: true,
      join_vars: true,
      drop_console: false,
      warnings: false
    }
  }))
}

var cssLoader = isRelease ? 'css!less' : 'css?sourceMap!less?sourceMap';
var preLoaders = isRelease ? [] : [ { test: /\.js$/, loader: 'source-map-loader' } ]

module.exports = {
  entry: {
    background: './src/background.ts',
    options: './src/options/options.ts',
    popup: './src/popup/popup.ts',
    contentScript: './src/contentScript/content-script.ts',
    styles: [ './src/options/options.less', './src/popup/popup.less', './src/contentScript/content-script.less' ]
  },

  output: {
    path: path.resolve(__dirname, 'extension/build'),
    filename: '[name].js',
  },

  devtool: 'source-map',

  resolve: {
    extensions: ['', '.json', '.webpack.js', '.web.js', '.ts', '.js']
  },

  module: {
    loaders: [
      {
        test: /\.json$/,
        loader: 'json-loader',
      },
      {
        test: /\.ts$/,
        loader: 'ts-loader'
      },
      {
        test: /\.less$/,
        include: [ path.resolve(__dirname, 'src', 'popup') ],
        loader: extractPopup.extract('style', cssLoader)
      },
      {
        test: /\.less$/,
        include: [ path.resolve(__dirname, 'src', 'options') ],
        loader: extractOptions.extract('style', cssLoader)
      },
      {
        test: /\.less$/,
        include: [ path.resolve(__dirname, 'src', 'contentScript') ],
        loader: extractContent.extract('style', cssLoader)
      }
    ],
    preLoaders: preLoaders
  },

  plugins: plugins
};
