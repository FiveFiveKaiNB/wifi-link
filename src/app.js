import { Component } from 'nervjs'
import Taro from '@tarojs/taro'
import './app.scss'

class App extends Component {

  componentWillMount() {
    this.setAppType()
  }

  setAppType() {
    const appid = Taro.getAccountInfoSync().miniProgram.appId
    const appIdMap = {
      'wx64a8a12740ed6d95': 'housekeeper',
      'wx86d9bed97bc5b99c': 'assistant'
    }
    Taro.setStorageSync('appType', appIdMap[appid])
  }

  async componentDidMount () {
    const layout = this.initLayout()
    Taro.setStorageSync('layout', layout)
  }

  initLayout() {
    const sysInfo = Taro.getSystemInfoSync()
    const capsule = Taro.getMenuButtonBoundingClientRect() // 小程序右上角胶囊按钮参数
    const model = sysInfo.model
    const reg = new RegExp('(iPhone10)|(iPhone11)|(iPhone12)')
    const hasButtomPadding = reg.test(model)

    const layout = {
      navBar: {
        top: capsule.top,
        contentHeight: capsule.height,
        padding: capsule.top - sysInfo.statusBarHeight,
        height: 2 * capsule.top + capsule.height - sysInfo.statusBarHeight // 顶部标题栏总高度，包含手机的statusBar
      },
      unitTransformRate: {
        px2rpx: (750 / sysInfo.screenWidth),
        rpx2px: (sysInfo.screenWidth / 750)
      },
      isAdaptation: hasButtomPadding,
      windowWidth: sysInfo.windowWidth
    }
    return layout
  }

  // this.props.children 是将要会渲染的页面
  render () {
    return this.props.children
  }
}

export default App
