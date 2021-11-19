const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  mode: 'development',
  entry: './src/js/scene.js',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'build/scene'),
  },
  plugins: [
    new HtmlWebpackPlugin({
        title : 'Hello',
        template: './src/template.html'
    })
],
};