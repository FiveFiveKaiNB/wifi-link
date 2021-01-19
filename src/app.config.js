export default {
  debug: true,
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#FAFAFA',
    navigationBarTitleText: 'WeChat',
    navigationBarTextStyle: 'black',
    navigationStyle: 'custom'
  },
  pages: [
    'pages/wifi-link/index',
    'pages/qr-code/index',
    'pages/wifi-code/index',
    'pages/index/index',
  ],
  tabBar: {
    color: '#BFBFBF',
    selectedColor: '#009C9C',
    backgroundColor: '#fff',
    borderStyle: 'white',
    list: [{
      pagePath: 'pages/wifi-link/index',
      text: '连接Wi-Fi',
      iconPath: './assets/wifi-link.png',
      selectedIconPath: './assets/wifi-link-active.png'
    },
    {
      pagePath: 'pages/wifi-code/index',
      text: '制作Wi-Fi码',
      iconPath: './assets/qrcode.png',
      selectedIconPath: './assets/qrcode-active.png'
    }]
  },
  permission: {
    'scope.userLocation': {
      'desc': '根据您的位置获取周边的wifi列表'
    }
  }
}
