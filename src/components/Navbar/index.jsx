import Taro from '@tarojs/taro'
import { View } from '@tarojs/components'
import Nerv, { Component } from 'nervjs'

import './index.scss'
import '@assets/aliIconfont/iconfont.css'

class Navbar extends Component {
  static options = {
    addGlobalClass: true
  }

  static defaultProps = {
    title: '',
    textColor: '#000000',
    bgColor: 'none',
    pos: 'fixed'
  }

  state = {
    isRootPage: false,
    isSwitchTabBar: false,
    switchTabBars: []
  }

  componentDidMount() {
    const pages = Taro.getCurrentPages()
    const currentPage = pages[pages.length - 1]
    const switchTabBars = Taro.getApp().config.tabBar.list.map(item => item.pagePath)
    this.setState({
      isRootPage: pages.length === 1,
      isSwitchTabBar: switchTabBars.indexOf(currentPage.route) > -1,
      switchTabBars
    })
  }

  // 返回上一页
  gotoBack() {
    const { givenPage } = this.props
    if (givenPage) {
      Taro.switchTab({ url: givenPage })
      return
    }
    Taro.navigateBack()
  }

  // 返回首页
  gotoHome() {
    const { switchTabBars } = this.state
    Taro.switchTab({ url: `/${switchTabBars[0]}` })
  }

  render() {
    const { title, textColor, bgColor, pos, onBack } = this.props
    const { navBar } = Taro.getStorageSync('layout')
    const { isRootPage } = this.state

    return (
      <View
        className='container'
        style={
          'color: ' + textColor +
          ';padding-top: ' + navBar.top +
          'px;height: ' + navBar.contentHeight +
          'px;fill: ' + textColor +
          ';background: ' + bgColor +
          ';padding-bottom: ' + navBar.padding +
          'px; position: ' + pos
        }
      >
        {
          !isRootPage &&
          (
            <View
              className='iconfont icon-arrow-left back-icon'
              onClick={onBack || this.gotoBack.bind(this)}
            >
            </View>
          )
        }
        <View className='title ld-line-ellipsis'>{title}</View>
      </View>
    )
  }
}

export default Navbar
