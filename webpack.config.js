var path = require('path');
var ExtractTextPlugin = require('extract-text-webpack-plugin');

var extractPopup = new ExtractTextPlugin('popup.css');
var extractOptions = new ExtractTextPlugin('options.css');
var extractContent = new ExtractTextPlugin('content.css');

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
        loader: extractPopup.extract('style', 'css?sourceMap!less?sourceMap')
      },
      {
        test: /\.less$/,
        include: [ path.resolve(__dirname, 'src', 'options') ],
        loader: extractOptions.extract('style', 'css?sourceMap!less?sourceMap')
      },
      {
        test: /\.less$/,
        include: [ path.resolve(__dirname, 'src', 'contentScript') ],
        loader: extractContent.extract('style', 'css?sourceMap!less?sourceMap')
      }
    ],
    preLoaders: [
      { test: /\.js$/, loader: 'source-map-loader' }
    ]
  },

  plugins: [
    extractPopup,
    extractOptions,
    extractContent
  ]
};
