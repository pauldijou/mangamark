var path = require('path');
var webpack = require("webpack");
var ExtractTextPlugin = require('extract-text-webpack-plugin');

var extractPopup   = new ExtractTextPlugin({ filename: 'popup.css'   });
var extractOptions = new ExtractTextPlugin({ filename: 'options.css' });
var extractContent = new ExtractTextPlugin({ filename: 'content.css' });

var plugins = [
  extractPopup,
  extractOptions,
  extractContent
];

var isRelease = process.argv.indexOf('--release') > 0;
var isWatching = process.argv.indexOf('--watch') > 0;

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

// var cssLoader = isRelease ? 'css!less' : 'css?sourceMap!less?sourceMap';

var extractPlugionOptions = {
  fallback: 'style-loader',
  use: [ 'css-loader' ].concat([ 'less-loader' ])
}

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

  watch: isWatching,

  resolve: {
    extensions: ['.json', '.webpack.js', '.web.js', '.ts', '.js']
  },

  module: {
    rules: [
      {
        test: /\.ts$/,
        use: [ 'ts-loader' ]
      },
      {
        test: /\.less$/,
        include: [ path.resolve(__dirname, 'src', 'popup') ],
        use: extractPopup.extract(extractPlugionOptions)
      },
      {
        test: /\.less$/,
        include: [ path.resolve(__dirname, 'src', 'options') ],
        use: extractOptions.extract(extractPlugionOptions)
      },
      {
        test: /\.less$/,
        include: [ path.resolve(__dirname, 'src', 'contentScript') ],
        use: extractContent.extract(extractPlugionOptions)
      }
    ].concat(isRelease ? [] : [
      {
        test: /\.js$/,
        use: 'source-map-loader',
        enforce: 'pre'
      }
    ])
  },

  plugins: plugins
};
