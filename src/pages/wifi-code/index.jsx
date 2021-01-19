import Nerv, { Component } from 'nervjs'
import Taro from '@tarojs/taro'
import { Navbar } from '@components/index'
import { View, Image } from '@tarojs/components'
import { get } from '@utils/request'

import './index.scss'

export default class WifiCode extends Component {
  state = {
    qrcodes: [
    ],
    status: 'hasNoneCode'
  }

  handleQrcode(item, index) {
    Taro.navigateTo({ url: `/pages/qr-code/index?wifiId=${item._id ? item._id : ''}` })
  }

  async componentDidShow() {
    const qrcodes = await get('/wifis/me')
    if (qrcodes.length === 0) {
      this.setState({ status: 'hasNoneCode' })
    } else {
      qrcodes.push({ url: 'https://qn-qghotel.lindingtechnology.com/pcenter_1605512925581' })
      this.setState({ qrcodes, status: 'qrcodes' })
    }
  }

  renderHasNoneCode() {
    return (
      <View>
        <Image className='qr-image' src='https://qn-qghotel.lindingtechnology.com/pcenter_1604556448642'></Image>
        <View className='tip-title'>连接Wi-Fi新方式</View>
        <View className='tip-text'>制作专属Wi-Fi｜无需告知密码｜扫码一键连</View>
        <View className='handle-code' onClick={this.handleQrcode.bind(this)}>制作我的二维码</View>
      </View>
    )
  }

  renderCodes() {
    const { qrcodes } = this.state
    return (
      qrcodes.map((item, index) => {
        return <View onClick={this.handleQrcode.bind(this, item, index)}>
          <Image src={item.url} className='image-item'></Image>
        </View>
      })
    )
  }

  calcNavTile() {
    let str = ''
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
    const { status } = this.state
    const navTitle = this.calcNavTile()
    return (
      <View className='wifi-code' style={'padding-top: ' + navBar.height + 'px'}>
        <Navbar title={navTitle} textColor='#000000' bgColor='#ffffff' />
        <View className='body'>
          { status === 'hasNoneCode' && this.renderHasNoneCode() }
          { status === 'qrcodes' && <View className='qr-codes'>
            { this.renderCodes() }
          </View> }
        </View>
      </View>
    )
  }
}
