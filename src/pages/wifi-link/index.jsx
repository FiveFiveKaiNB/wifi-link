import Nerv, { Component } from 'nervjs'
import Taro from '@tarojs/taro'
import { Navbar } from '@components/index'
import { View, Image } from '@tarojs/components'
import { get } from '@utils/request'
import WifiPopup from './wifi-popup/index'
import './index.scss'

export default class WifiLink extends Component {
  state = {
    infoStyle: {
      height: '0vh',
      transition: 'height 0.6s ease'
    },
    maskStyle: {
      transition: 'all 0.2s',
      zIndex: '-1',
      opacity: 0
    }
  }

  detaisClose() {
    const infoStyle = {
      height: '0vh',
      transition: 'height 0.6s ease'
    }
    const maskStyle = {
      zIndex: '-1',
      opacity: 0,
      transition: 'all 0.2s'
    }
    this.setState({ detaisShow: false, infoStyle, maskStyle })
  }

  async componentDidMount() {
    const pages = Taro.getCurrentPages()
    const { options } = pages[pages.length - 1]
    let wifiInfo = {}

    if (options.wifiId) {
      wifiInfo = await get(`/wifis/${options.wifiId}`)
      const userInfo = Taro.getStorageSync('userInfo')
      this.initQrcodeHandle(wifiInfo, userInfo)
      return
    }
    if (options.s) {
      wifiInfo.name = options.s
      wifiInfo.password = options.p
      this.link.startWifiFn(wifiInfo)
      this.openWifiPopup()
    }
  }

  initQrcodeHandle(wifiInfo, userInfo) {
    if (!wifiInfo.userId) {
      Taro.navigateTo({ url: `/pages/qr-code/index?wifiId=${wifiInfo._id}` })
      return
    }

    if (userInfo._id !== wifiInfo.userId) {
      this.link.startWifiFn(wifiInfo)
      this.openWifiPopup()
      return
    }

    Taro.showActionSheet({
      itemList: ['编辑wifi', '连接wifi'],
      success: (res) => {
        if (res.tapIndex === 0) return Taro.navigateTo({ url: `/pages/qr-code/index?wifiId=${wifiInfo._id}` })
        if (res.tapIndex === 1) {
          this.link.startWifiFn(wifiInfo)
          this.openWifiPopup()
        }
      }
    })
  }

  openWifiPopup() {
    const infoStyle = {
      height: '80vh',
      transition: 'height 0.6s ease'
    }
    const maskStyle = {
      zIndex: '9',
      opacity: 1,
      transition: 'all 0.2s'
    }
    this.setState({ infoStyle, maskStyle })
  }

  async scanLink() {
    Taro.scanCode({
      success: async(res) => {
        console.log(res)
        if (res.path) {
          await this.userQrcodeHandle(res)
          return
        }
        await this.qgQrcodeHandle(res)
      }
    })
  }

  async qgQrcodeHandle(res) {
    if (!res.result) return
    try {
      Taro.showLoading({
        title: '打开wifi弹窗中。。。'
      })
      const { data } = await get('/common/getQgWifiInfo', { mark: res.result })
      const wifiInfo = {}
      wifiInfo.name = data.ssid
      wifiInfo.password = data.password
      this.link.startWifiFn(wifiInfo)
      this.openWifiPopup()
      Taro.hideLoading()
    } catch (error) {
      Taro.showToast({
        title: '打开wifi弹窗失败',
        icon: 'none',
        duration: 2000
      })
      return false
    }
  }

  async userQrcodeHandle(res) {
    const path = res.path.split('?')
    if (!path[1]) return
    const wifiId = path[1].split('=')
    Taro.showLoading({
      title: '获取二维码信息中。。。'
    })
    const wifiInfo = await get(`/wifis/${wifiId[1]}`)
    Taro.hideLoading()
    const userInfo = Taro.getStorageSync('userInfo')
    this.initQrcodeHandle(wifiInfo, userInfo)
  }
  calcNavTile() {
    let str = ''
    console.log(Taro.getStorageSync('appType'), '===-=-')
    switch (Taro.getStorageSync('appType')) {
      case 'housekeeper':
        str = '青果Wi-Fi管家'
        break
      case 'assistant':
        str = '青果Wi-Fi助手'
        break
      default:
        str = 'Wi-Fi连接'
    }
    return str
  }

  render() {
    const { navBar } = Taro.getStorageSync('layout')
    const { infoStyle, maskStyle } = this.state
    const navTitle = this.calcNavTile()
    return (
      <View className='wifi-link' style={'padding-top: ' + navBar.height + 'px'}>
        <Navbar title={navTitle} textColor='#000000' bgColor='#ffffff' />
        <View className='body'>
          <Image className='image' src={'https://qn-qghotel.lindingtechnology.com/pcenter_1605248225315'}></Image>
          <View className='tip'>微信扫码一键连Wi-Fi</View>
          <View className='text'>全自动，无需输密码</View>
          <View className='link-btn' onClick={this.scanLink.bind(this)}>
            <Image className='icon' src='https://qn-qghotel.lindingtechnology.com/pcenter_1604556482320'></Image>
            扫码连接
          </View>
        </View>
        <WifiPopup
          onRef={(ref) => { this.link = ref }}
          infoStyle={infoStyle}
          maskStyle={maskStyle}
          serviceDetaisClose={this.detaisClose.bind(this)}
        />
      </View>
    )
  }
}
