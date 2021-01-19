import Taro, { getSystemInfoSync } from '@tarojs/taro'
import { View, Image } from '@tarojs/components'
import Nerv, { Component } from 'nervjs'
import { put } from '@utils/request'

import './index.scss'

class WifiPopup extends Component {
  config = {
  }
  state = {
    form: {},
    isIos: false,
    connectStatus: '',
    upStatus: '',
    wifiInfo: {
      'SSID': '',
      password: ''
    },
    wifiClassName: 'wifi',
    wifiErrorMsg: {
      12001: '当前系统不支持相关能力',
      12002: '密码错误，请联系后台工作人员',
      12003: '连接超时',
      12004: '请勿重复连接 Wi-Fi',
      12005: '你没有打开wifi哦,请打开wifi后重试',
      12006: '连接超时，您可能未打开 GPS 定位开关',
      12007: '用户拒绝授权链接 Wi-Fi',
      12008: '无效 SSID',
      12010: '系统其它错误',
      12009: '系统运营商配置拒绝连接 Wi-Fi',
      12011: '应用在后台无法配置 Wi-Fi',
      12013: '系统保存的 Wi-Fi 配置过期，建议忘记 Wi-Fi 后重试示例代码'
    },
    connectWifiStatus: {
      getWifiInfo: false,
      startWifiConnect: false,
      isConneced: false
    },
    // 是否连接房间wifi
    connectRoomWifi: false,
    // 其他wifi的信息
    otherWifi: '',
    showErrorMsg1: '',
    showErrorMsg2: '',
    showErrorMsg3: '',
    showErrorMsg4: '',
    findWifi: false
  }

  componentDidMount() {
    this.props.onRef(this)
  }

  startWifiFn(data) {
    const phoneInfo = getSystemInfoSync()
    const isIos = phoneInfo.platform === 'ios'
    const wifiInfo = {}
    wifiInfo.SSID = data.name
    wifiInfo.password = data.password
    wifiInfo._id = data._id || ''
    this.setState({ wifiInfo, isIos }, async() => {
      await this.initWifi(wifiInfo, isIos)
    })
  }

  async reConnect() {
    const { wifiInfo, isIos, connectWifiStatus } = this.state
    connectWifiStatus.isConneced = false
    this.setState({ connectStatus: 'connecting', connectWifiStatus }, async() => {
      await this.checkMobelConnect(wifiInfo, isIos)
    })
  }

  closeDetail() {
    const { serviceDetaisClose } = this.props
    const { connectRoomWifi, wifiInfo, isIos } = this.state
    if (connectRoomWifi) {
      serviceDetaisClose()
    } else {
      const { connectWifiStatus } = this.state
      connectWifiStatus.isConneced = false
      this.setState({ connectStatus: 'connecting', connectWifiStatus }, async() => {
        await this.connectRoomWifiFn(wifiInfo, isIos)
      })
    }
  }

  returnUpPage() {
    const { upStatus } = this.state
    this.setState({ connectStatus: upStatus })
  }

  async initWifi(wifiInfo, isIos) {
    const initStatus = {
      getWifiInfo: false,
      startWifiConnect: false,
      isConneced: false
    }
    this.setState({ initStatus }, async() => {
      await this.checkMobelConnect(wifiInfo, isIos)
    })
  }

  async checkMobelConnect(wifiInfo, isIos) {
    const { connectWifiStatus } = this.state
    await Taro.startWifi()
    connectWifiStatus.startWifiConnect = true
    this.setState({ connectWifiStatus })

    try {
      const info = await Taro.getConnectedWifi()
      console.log('初始化获得的手机已连接wifi信息', info)
      connectWifiStatus.getWifiInfo = true
      this.setState({ connectWifiStatus })

      // 成功连接wifi后 则不需要往后执行了
      if (info.wifi.SSID === wifiInfo.SSID) {
        console.log('已成功连接房间wifi')
        this.setState({ connectStatus: 'connected', connectRoomWifi: true })
      } else {
        this.setState({
          connectRoomWifi: false,
          connectStatus: 'connected',
          otherWifi: info.wifi.SSID
        })
      }
      return
    } catch (error) {
      console.log(error, '这里打印了初始化getConnectedWifi函数的catch函数')
      this.setState({ connectRoomWifi: false })
      // 这里对一些特定的机型做兼容
      if (error.errCode === 12010 && error.errMsg === 'getConnectedWifi:fail:currentWifi is null') {
        this.setState({ connectStatus: 'connecting' })
        this.connectRoomWifiFn(wifiInfo, isIos)
        return
      }

      if (error.errCode === 12005) {
        this.setState({ connectStatus: 'fail', showErrorMsg1: '你没有打开wifi哦,请打开wifi后重试' })
        return
      }
      this.setState({ connectStatus: 'connecting' })
      this.connectRoomWifiFn(wifiInfo, isIos)
    }
  }

  checkWifi(res, ssid) {
    if (!res) return false
    let findWifi = false
    const { wifiList } = res
    wifiList.map(item => {
      if (ssid === item.SSID) {
        findWifi = true
      }
    })
    return findWifi
  }

  async getAndroidWifiList() {
    const { wifiInfo, isIos } = this.state
    // 不对ios进行获取wifiList的操作
    if (isIos) return false

    let findWifi = false
    try {
      await Taro.getWifiList()
      const getWifiList = async() => {
        return new Promise((resolve, reject) => {
          Taro.onGetWifiList(function(res) {
            resolve(res)
          })
        })
      }
      const wifiList = await getWifiList()
      findWifi = this.checkWifi(wifiList, wifiInfo.SSID)
    } catch (error) {
      console.log(error, '这里是getWifiList获取到的错误')
    }
    return findWifi
  }

  resetShowErrorMsg() {
    this.setState({
      showErrorMsg1: '',
      showErrorMsg2: '',
      showErrorMsg3: '',
      showErrorMsg4: ''
    })
  }

  async checkCurrentWifi() {
    const { wifiInfo } = this.state
    const info = await Taro.getConnectedWifi()
    if (info.wifi.SSID === wifiInfo.SSID) {
      this.setState({ connectStatus: 'connected' })
    } else {
      this.setState({ connectStatus: 'fail', showErrorMsg1: '未能成功连接卡片wifi,请打开GPS后重试' })
    }
  }

  connectRoomWifiFn(wifiInfo, isIos) {
    const { connectWifiStatus } = this.state
    this.resetShowErrorMsg()
    const _this = this
    console.log('要连接的wifi信息==========', wifiInfo)
    Taro.connectWifi({
      SSID: wifiInfo.SSID,
      password: wifiInfo.password,
      async success() {
        // 针对安卓的机型做一个匹配
        if (!isIos) {
          connectWifiStatus.isConneced = true
          _this.setState({ connectRoomWifi: true, connectWifiStatus, connectStatus: 'connected' })
          await put('/wifis/addConnectCount', { wifiId: wifiInfo._id })
        }
      },

      async fail(res) {
        switch (res.errCode) {
          case 12007:
            _this.setState({ showErrorMsg1: '您拒绝连接wifi，请点击重试按钮再次连接wifi', connectStatus: 'fail' })
            break
          case 12003:
            _this.setState({
              showErrorMsg1: '1、请检查手机是否打开wifi',
              showErrorMsg2: '2、请检查手机是否打开GPS',
              showErrorMsg3: '3、wifi信号弱',
              showErrorMsg4: '4、wifi密码错误',
              connectStatus: 'fail'
            })
            break
          case 12006:
            // 安卓手机 12006错误 有一些也能成功连接wifi
            _this.checkCurrentWifi()
            break
          case 12002:
            _this.setState({
              showErrorMsg1: '1、wifi密码错误',
              showErrorMsg2: '2、手机曾经意外连接过错误密码',
              showErrorMsg3: '3、请打开手机设置中的wifi列表，根据账号手动填写密码',
              showErrorMsg4: '4、如果一直出现无论扫什么码都连接失败的情况，则属于上述第二种情况，然后再执行第三个步骤',
              connectStatus: 'fail'
            })
            break
          default:
            console.error(res.errCode, res, '其他错误')
        }

        if (isIos && res.errCode === 12010 && error.errMsg === 'connectWifi:fail internal error') {
          Taro.showToast({
            title: '上一次连接还未结束，请稍等。。。',
            icon: 'none',
            duration: 2000
          })
        }
        if (res.errCode === 12010 && error.errMsg === `connectWifi:fail:can't gain current wifi`) {
          this.setState({ connectStatus: 'connected' })
        }
      },

      async complete() {
        if (isIos) {
          Taro.getConnectedWifi().then(async(res) => {
            if (res.wifi.SSID === wifiInfo.SSID) {
              console.log('连接房间wifi', res.wifi.SSID, '++++++++', wifiInfo, '-------------')
              connectWifiStatus.isConneced = true
              console.log('这里执行了没有呀呀呀呀呀')
              await put('/wifis/addConnectCount', { wifiId: wifiInfo._id })
              _this.setState({ connectStatus: 'connected', connectWifiStatus, connectRoomWifi: true })
              return
            }
            connectWifiStatus.isConneced = false
            const connectStatus = 'connected'
            _this.setState({ connectRoomWifi: false, connectStatus, connectWifiStatus, otherWifi: res.wifi.SSID })
          }).catch(error => {
            console.log(error, '===getConnectedWifi函数的错误信息')
            connectWifiStatus.isConneced = true
            setTimeout(() => {
              _this.setState({ connectStatus: 'fail', connectWifiStatus, showErrorMsg1: '找不到wifi，或者wifi密码错误，请尝试手动连接' })
            }, 2000)
          })
        }
      }
    })
  }

  handleConnect() {
    this.setState({ connectStatus: 'handleConnect', upStatus: this.state.connectStatus })
  }

  copyPassword() {
    const { wifiInfo } = this.state
    Taro.setClipboardData({
      data: wifiInfo.password,
      success(res) {
        wx.getClipboardData({
          success(res) {
            console.log(res.data)
          }
        })
      }
    })
  }

  // 根据当前状态渲染不同的Ui
  renderWifiService() {
    const { connectStatus, wifiClassName } = this.state

    return (
      <View className={wifiClassName}>
        { connectStatus === 'connecting' && this.renderConnecting() }
        { connectStatus === 'connected' && this.renderConnectSuccess() }
        { connectStatus === 'fail' && this.renderConnectFail() }
        { connectStatus === 'handleConnect' && this.renderHandleConnect() }
      </View>
    )
  }

  // 正在连接中
  renderConnecting() {
    const { connectWifiStatus } = this.state
    const checkIcon = 'https://qn-qghotel.lindingtechnology.com/pcenter_1600334972508'
    const uncheckIcon = 'https://qn-qghotel.lindingtechnology.com/pcenter_1600334965371'
    return (
      <View>
        <Image src={`https://qn-qghotel.lindingtechnology.com/weapp/service/wifi-connecting.gif`} className='wifi-bgc' />
        <View className='connecting-wifi'>{ '正在检查Wi-Fi连接状态'}</View>

        <View className='connecting-state'>
          <View className='connecting-text'>{'初始化Wi-Fi模块' + `${!connectWifiStatus.startWifiConnect ? '...' : ''}`}</View>
          <Image
            src={`${!connectWifiStatus.startWifiConnect
              ? checkIcon
              : uncheckIcon}`}
            className='connecting-icon'
          />
        </View>

        <View className='connecting-state'>
          <View className='connecting-text'>{'获取wifi信息中' + `${!connectWifiStatus.getWifiInfo ? '...' : ''}`}</View>
          <Image
            src={`${!connectWifiStatus.getWifiInfo
              ? checkIcon
              : uncheckIcon}`}
            className='connecting-icon'
          />
        </View>

        <View className='connecting-state'>
          <View className='connecting-text'>{'尝试自动连接' + `${!connectWifiStatus.isConneced ? '...' : ''}`} </View>
          <Image
            src={`${!connectWifiStatus.isConneced
              ? checkIcon
              : uncheckIcon}`}
            className='connecting-icon'
          />

        </View>
      </View>
    )
  }

  // 连接成功
  renderConnectSuccess() {
    const { wifiInfo, connectRoomWifi, otherWifi } = this.state

    return (
      <View>
        <Image src={'https://qn-qghotel.lindingtechnology.com/pcenter_1598602212645'} className='wifi-bgc'></Image>
        <View className='connecting-wifi'>{`您已连接以下WIFI`}</View>
        <View className='connecting-text'>{connectRoomWifi ? wifiInfo.SSID : otherWifi}</View>
        <View className='connected-btns'>
          <View className='connected-success' onClick={this.closeDetail.bind(this)}>{ connectRoomWifi ? '好的' : `更新连接`}</View>
          <View className='handle-show-password' onClick={this.handleConnect.bind(this)}>点击查看Wi-Fi密码</View>
        </View>
      </View>
    )
  }

  // 连接失败
  renderConnectFail() {
    const { showErrorMsg1, showErrorMsg2, showErrorMsg3, showErrorMsg4 } = this.state
    return (
      <View className='connect-fail'>
        <Image src={`https://qn-qghotel.lindingtechnology.com/pcenter_1600339442739`} className='fail-bgc'></Image>
        <View className='error-msg'>连接出错，原因可能如下：</View>
        <View className='error-tip'>{showErrorMsg1}</View>
        <View className='error-tip'>{showErrorMsg2}</View>
        <View className='error-tip'>{showErrorMsg3}</View>
        <View className='error-tip'>{showErrorMsg4}</View>
        <View className='fail-btns'>
          <View className='handle-connect' onClick={this.handleConnect.bind(this)}>手动连接</View>
          <View className='handle-reconnect' onClick={this.reConnect.bind(this)}>重试</View>
        </View>
      </View>
    )
  }

  // 手动连接
  renderHandleConnect() {
    const { wifiInfo } = this.state
    return (
      <View className='handle-connect'>
        <View className='wifi-item'>
          <View className='wifi-label'>Wi-Fi名称：</View>
          <View className='wifi-value'>{wifiInfo.SSID}</View>
        </View>
        <View className='wifi-item'>
          <View className='wifi-label'>Wi-Fi密码：</View>
          <View className='wifi-value'>{wifiInfo.password}</View>
        </View>
        {/* <View className='copy-password' onClick={this.copyPassword.bind(this)}>复制密码</View> */}
        <View className='handle-wifi-btns'>
          <View className='return-page' onClick={this.returnUpPage.bind(this)}>返回上一页</View>
          <View className='copy-password' onClick={this.copyPassword.bind(this)}>复制密码</View>
        </View>
      </View>
    )
  }

  renderServiceItem() {
    const { maskStyle, infoStyle, serviceDetaisClose } = this.props
    return (
      <View className='service'>
        <View className='service-mask' style={maskStyle} onClick={ () => serviceDetaisClose() }></View>
        <View className='details' style={infoStyle} onClick={(e) => e.stopPropagation()}>
          <View className='details-info'>
            <View className='details-title'>
              <View className='icon-text'>
                <Image src={'https://qn-qghotel.lindingtechnology.com/pcenter_1600246095588'} className='icon' />
                <View className='name'>WIFI一键连</View>
              </View>
              <Image src={'https://qn-qghotel.lindingtechnology.com/pcenter_1600323633905'} className='detail-close' onClick={() => serviceDetaisClose()}></Image>
            </View>
            { this.renderWifiService() }
          </View>
        </View>
      </View>

    )
  }
  render() {
    return (
      <View>
        { this.renderServiceItem() }
      </View>
    )
  }
}

export default WifiPopup
