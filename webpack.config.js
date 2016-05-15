var path = require('path');

module.exports = {
  entry: {
    background: './src/background.ts',
    options: './src/options.ts',
    popup: './src/popup.ts',
    contentScript: './src/content-script.ts',
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
      }
    ],
    preLoaders: [
      { test: /\.js$/, loader: 'source-map-loader' }
    ]
  }
};
