var path = require('path');
var ExtractTextPlugin = require('extract-text-webpack-plugin');

module.exports = {
  entry: {
    background: './src/background.ts',
    options: './src/options/options.ts',
    popup: './src/popup/popup.ts',
    contentScript: './src/content-script.ts',
    styles: [ './src/options/options.less', './src/popup/popup.less' ]
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
        loader: ExtractTextPlugin.extract('style', 'css?sourceMap!less?sourceMap')
      }
    ],
    preLoaders: [
      { test: /\.js$/, loader: 'source-map-loader' }
    ]
  },

  plugins: [
    new ExtractTextPlugin('styles.css')
  ]
};
