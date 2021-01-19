module.exports = {
  env: {
    NODE_ENV: '"production"'
  },
  defineConstants: {
    QINIU_BASE_PATH: JSON.stringify('weapp'),
    HOTEL_NAME: JSON.stringify('青果酒店本地'),
    API_HOST: JSON.stringify('https://wifi.wifi.lindingtechnology.com')
  },
  mini: {},
  h5: {
    /**
     * 如果h5端编译后体积过大，可以使用webpack-bundle-analyzer插件对打包体积进行分析。
     * 参考代码如下：
     * webpackChain (chain) {
     *   chain.plugin('analyzer')
     *     .use(require('webpack-bundle-analyzer').BundleAnalyzerPlugin, [])
     * }
     */
  }
}
