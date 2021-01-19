module.exports = {
  env: {
    NODE_ENV: '"development"'
  },
  defineConstants: {
    QINIU_BASE_PATH: JSON.stringify('weapp'),
    HOTEL_NAME: JSON.stringify('青果酒店本地'),
    API_HOST: JSON.stringify('https://wifi.lindingtechnology.com')
    // API_HOST: JSON.stringify('http://172.17.1.174:6100')
  },
  mini: {},
  h5: {}
}
