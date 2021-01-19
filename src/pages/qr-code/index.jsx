import Nerv, { Component } from 'nervjs'
import Taro, { getCurrentInstance, getSystemInfoSync } from '@tarojs/taro'
import { Navbar } from '@components/index'
import { post, put, get, del } from '@utils/request'
import { View, Image, Input, Canvas, Button } from '@tarojs/components'
import { qiniuInit, qiniuUpload } from '@utils/qiniu_uploader'
import classnames from 'classnames'
import './index.scss'

export default class QrCode extends Component {
  state = {
    qrcodes: [
      'https://qn-qghotel.lindingtechnology.com/pcenter_1604557904983'
    ],
    status: '',
    wifiInfo: {
      name: '',
      password: '',
      desc: ''
    },
    btnText: '生成我的二维码',
    canvasStatus: false,
    currentWifi: '',
    wifiList: [],
    detailShow: false,
    nameFocus: false,
    saving: false,
    imgUrl: 'https://qn-qghotel.lindingtechnology.com/pcenter_1606460103080',
    showUrl: ''
  }

  async canvasDraw(qrcode, data, type) {
    this.setState({
      canvasStatus: true
    })
    Taro.showLoading({
      title: '生成海报中...'
    })
    setTimeout(() => {
      this.initCanvas(qrcode, data, type)
    }, 200)
  }

  initCanvas(qrcode, wifiInfo, type) {
    const that = this
    const query = Taro.createSelectorQuery()
    query.select('#canvas')
      .fields({ node: true, size: true })
      .exec(async(res) => {
        const canvas = res[0].node
        const ctx = canvas.getContext('2d')
        const dpr = Taro.getSystemInfoSync().pixelRatio
        console.log(Taro.getSystemInfoSync(), '-=-=-=-=')
        canvas.width = 281 * 2
        canvas.height = 394 * 2
        ctx.scale(2, 2)

        // 将要绘制的图片放在一个数组中
        const imgList = []
        imgList.push(
          {
            // 背景图片
            src: 'https://qn-qghotel.lindingtechnology.com/pcenter_1609226508693'
          },
          {
            // 二维码
            src: qrcode
            // src: 'https://qn-qghotel.lindingtechnology.com/pcenter_1601447980538'
          }
        )
        // 对图片数组进行接口调用返回Promise并将结果存入Promise.all数组中
        const imgPromise = await Promise.all(imgList.map((item) => {
          return Taro.getImageInfo({
            src: item.src
          })
        })).catch(err => {
          console.log(err)
        })
        // 对Promise.all数组进行图片绘制操作
        // imgPromise.forEach((item, index) => {
        //   const imgtag = canvas.createImage()
        //   imgtag.src = item.path
        //   if (index === 0) {
        //     imgtag.onload = () => {
        //       ctx.drawImage(imgtag, 0, 0, 281, 400)
        //     }
        //   }
        //   if (index === 1) {
        //     imgtag.onload = () => {
        //       ctx.drawImage(imgtag, 68, 140, 145, 166)
        //     }
        //   }
        // })

        const imgtagBgc = canvas.createImage()
        imgtagBgc.src = imgPromise[0].path

        imgtagBgc.onload = () => {
          ctx.drawImage(imgtagBgc, 0, 0, 281, 400)
          const imgtagQrcode = canvas.createImage()
          imgtagQrcode.src = imgPromise[1].path
          imgtagQrcode.onload = () => {
            ctx.drawImage(imgtagQrcode, 68, 140, 145, 166)
          }
        }

        setTimeout(() => {
          ctx.save()
          ctx.fillStyle = '#1B1B1B'
          ctx.font = '16px sans-serif'
          ctx.fillText(wifiInfo.name, Math.floor((281 - ctx.measureText(wifiInfo.name).width) * 0.5), 330)

          ctx.fillStyle = '#A5A5A5'
          ctx.font = '14px sans-serif'
          ctx.fillText(wifiInfo.desc, Math.floor((281 - ctx.measureText(wifiInfo.desc).width) * 0.5), 350)

          ctx.restore()
        }, 200)

        setTimeout(() => {
          Taro.canvasToTempFilePath({
            canvas,
            width: 281,
            height: 394,
            success: function(res) {
              that.setState({ showUrl: res.tempFilePath })
              try {
                qiniuUpload(res.tempFilePath, async({ imageURL }) => {
                  wifiInfo.url = imageURL
                  await put(`/wifis/${wifiInfo._id}`, wifiInfo)
                  that.setState({ wifiInfo, canvasStatus: false })
                  that.setState({ status: 'edit' })
                })
                Taro.hideLoading()
              } catch (error) {
                console.error('失败了 ', error)
              }
            },
            complete: function() {
              Taro.hideLoading()
            }
          })
        }, 2000)
      })
  }

  onShareAppMessage() {
    const { wifiInfo } = this.state
    return {
      title: 'wifi码',
      path: `/pages/wifi-link/index?wifiId=${wifiInfo._id}`
    }
  }

  async componentDidShow() {
    const { router: { params }} = Taro.getCurrentInstance()
    qiniuInit({
      region: 'z2',
      uptokenURL: `${API_HOST}/common/uptoken`,
      domain: 'https://qn-qghotel.lindingtechnology.com',
      shouldUseQiniuFileName: false
    })

    if (!params.wifiId) {
      this.setState({ status: 'added' })
      await this.getCurrentWifi()
      return
    }

    const wifiInfo = await get(`/wifis/${params.wifiId}`)
    if (!wifiInfo.name) {
      this.setState({ status: 'added', wifiInfo })
      return
    }

    this.setState({ status: 'edit', wifiInfo })
  }

  async getCurrentWifi() {
    const phoneInfo = getSystemInfoSync()
    const isIos = phoneInfo.platform === 'ios'
    let loc = null
    if (!isIos) {
      try {
        loc = await Taro.getLocation()
      } catch (e) {
        console.error('获取位置失败', e)
      }
    }
    await Taro.startWifi()
    try {
      const info = await Taro.getConnectedWifi()
      console.log('初始化获得的手机已连接wifi信息', info)
      this.setState({ currentWifi: info.wifi.SSID })
    } catch (error) {
      this.setState({ currentWifi: '' })
    }

    if (isIos || !loc) return
    try {
      await Taro.getWifiList()
      const getWifiList = async() => {
        return new Promise((resolve, reject) => {
          Taro.onGetWifiList(function(res) {
            resolve(res)
          })
        })
      }
      let { wifiList } = await getWifiList()
      wifiList = wifiList.slice(0, 5)
      this.setState({ wifiList })
    } catch (error) {
      console.log(error, '这里是getWifiList获取到的错误')
    }
  }

  valueChange(key, e) {
    this.setState((prevState) => ({
      wifiInfo: {
        ...prevState.wifiInfo,
        [key]: e.detail.value
      }
    }))
  }
  // 保存到手机
  async saveToAlbum() {
    if (this.state.saving) return
    const { wifiInfo } = this.state
    this.setState({ saving: true })
    const imgData = await Taro.getImageInfo({
      src: wifiInfo.url
    })
    if (imgData) {
      Taro.saveImageToPhotosAlbum({ filePath: imgData.path }).then(item => {
        Taro.showToast({
          title: '保存图片成功',
          icon: 'none',
          duration: 1000
        })
        this.setState({ saving: false })
      }).catch(err => {
        this.setState({ saving: false })
        if (err.errMsg === 'saveImageToPhotosAlbum:fail cancel') return
        Taro.getSetting().then(res => {
          if (!res.authSetting['scope.saveImageToPhotosAlbum']) {
            Taro.showModal({
              title: '提示',
              content: '若点击不授权，将无法使用保存图片功能',
              cancelText: '不授权',
              cancelColor: '#999',
              confirmText: '授权',
              confirmColor: '#f94218'
            }).then(res => {
              wx.openSetting({
                success(res) {
                  console.log(res)
                }
              })
            })
          }
        })
      })
    }
  }

  async wifiInfoSubmit() {
    const { wifiInfo, btnText } = this.state
    let data = null
    const reg = new RegExp('[\\u4E00-\\u9FFF]+', 'g')
    if (!wifiInfo.name) {
      Taro.showToast({
        title: '请填写正确的wifi名',
        icon: 'none',
        duration: 1000
      })
      return false
    }
    if (reg.test(wifiInfo.password)) {
      Taro.showToast({
        title: 'wifi密码不能包含汉字',
        icon: 'none',
        duration: 1000
      })
      return false
    }
    if (wifiInfo.password && wifiInfo.password.length < 8) {
      Taro.showToast({
        title: 'wifi密码不能小于8位',
        icon: 'none',
        duration: 1000
      })
      return false
    }

    const member = Taro.getStorageSync('appType')
    const checkWifiName = await post('/common/checkMsg', { content: wifiInfo.name, member })
    if (checkWifiName.errcode !== 0) {
      Taro.showToast({
        title: '该wifi名不符合微信规则，请修改后重试',
        icon: 'none',
        duration: 2000
      })
      return false
    }

    const checkWifiTip = await post('/common/checkMsg', { content: wifiInfo.desc === '' ? 1 : wifiInfo.desc, member })
    if (checkWifiTip.errcode !== 0) {
      Taro.showToast({
        title: '该wifi描述不符合微信规则，请修改后重试',
        icon: 'none',
        duration: 2000
      })
      return false
    }

    if (btnText === '保存修改') {
      data = await put(`/wifis/${wifiInfo._id}`, wifiInfo)
      await this.canvasDraw(data.qrcode, data, 'update')
      return
    }

    if (btnText === '生成我的二维码' && !wifiInfo._id) {
      data = await post('/wifis', { ...wifiInfo, member })
      await this.canvasDraw(data.qrcode, data, 'added')
      return
    }
  }

  async showDetail() {
    try {
      await this.getCurrentWifi()
    } catch (error) {
      console.log(error)
    }
    this.setState({ detailShow: true })
  }

  setWifiName(name) {
    const { wifiInfo } = this.state
    wifiInfo.name = name
    this.setState({ wifiInfo, detailShow: false })
  }

  renderSelectWifi() {
    const { currentWifi, wifiList } = this.state
    return (
      <View className='detail'>
        <View className='detail-mask' onClick={() => { this.setState({ detailShow: false }) }}></View>

        <View className='wifi-list'>
          { currentWifi
            ? <View className={classnames('wifi-item', 'current')} onClick={this.setWifiName.bind(this, currentWifi)}>{currentWifi}</View>
            : <View className={classnames('wifi-item', 'current')}>连接Wi-Fi可以快捷选择名称</View>
          }
          { wifiList.length !== 0 && wifiList.map((item, index) => {
            return (
              <View className='wifi-item' onClick={this.setWifiName.bind(this, item.SSID)} >
                { item.SSID }
              </View>
            )
          }) }
          <View className={classnames('wifi-item')} onClick={() => { this.setState({ detailShow: false, nameFocus: true }) }}>+ 手动输入</View>
          <View className={classnames('wifi-item', 'cancel')} onClick={() => { this.setState({ detailShow: false }) }} >取消</View>
        </View>
      </View>
    )
  }

  wifiBlur(e) {
    this.setState({ nameFocus: false })
  }

  renderNewQrInfo() {
    const { wifiInfo, btnText, nameFocus, imgUrl } = this.state
    return (
      <View className='qr-info'>
        <View className='img-div'>
          {/* <Image className='demo' src={wifiInfo.url ? wifiInfo.url : 'https://qn-qghotel.lindingtechnology.com/pcenter_1606460103080'}></Image> */}
          <Image className='demo' src={imgUrl}></Image>
          <View className='real-name'>{ wifiInfo.name || '此处显示Wi-Fi名称' }</View>
          <View className='real-desc'>{ wifiInfo.desc || '无需输入密码，自动连接Wi-Fi' }</View>
        </View>
        { (wifiInfo.connectCount !== 0 && wifiInfo.connectCount) && <View className='connect-count'>累计连接{wifiInfo.connectCount}次</View> }
        <View className='items'>
          <View className='item'>
            <View className='label'>Wi-Fi名称：</View>
            { !nameFocus && <View className={classnames('text', 'un-focus', wifiInfo.name && 'get-focus') } onClick={this.showDetail.bind(this)}> { wifiInfo.name ? wifiInfo.name : '请选择或输入Wi-Fi名称' }</View> }
            { nameFocus &&
              <Input
                placeholderStyle={'color: #BFBFBF'}
                className='text'
                focus={nameFocus}
                onBlur={this.wifiBlur.bind(this)}
                type='text'
                value={ wifiInfo.name }
                onInput={this.valueChange.bind(this, 'name')}
                placeholder='请输入Wi-Fi名称'>
              </Input>
            }
          </View>
          <View className='item'>
            <View className='label'>Wi-Fi密码：</View>
            <Input className='text' placeholderStyle={'color: #BFBFBF'} type='text' value={wifiInfo.password} onInput={this.valueChange.bind(this, 'password')} placeholder='输入Wi-Fi密码（无密码可不填）'></Input>
          </View>
          <View className='item'>
            <View className='label'>Wi-Fi描述：</View>
            <Input className='text' type='text' placeholderStyle={'color: #BFBFBF'} value={wifiInfo.desc} onInput={this.valueChange.bind(this, 'desc')} placeholder='如“青果Wi-Fi欢迎您”'></Input>
          </View>
          <View className='user-handle' onClick={this.wifiInfoSubmit.bind(this)}>{btnText}</View>
        </View>
      </View>
    )
  }

  editQrInfo() {
    this.setState({ status: 'added', btnText: '保存修改' })
  }

  async delQrCode() {
    const { wifiInfo } = this.state
    await del(`/wifis/${wifiInfo._id}`)
    Taro.navigateBack()
  }

  renderEditQrInfo() {
    const { wifiInfo, showUrl } = this.state
    console.log(showUrl, '===-=-')
    return (
      <View className='edit-info'>
        <Image className='qr-image' src={ showUrl || wifiInfo.url}></Image>
        {/* <View className='qr-image'>
          <Image className='qr-background' src='https://qn-qghotel.lindingtechnology.com/pcenter_1609226508693'></Image>
          <Image className='qrcode' src={wifiInfo.qrcode}></Image>
          <View className='qr-name'>{ wifiInfo.name }</View>
          <View className='qr-desc'>{ wifiInfo.desc }</View>
        </View> */}
        <View className='tip'>分享给好友或者保存到相册打印出来吧</View>
        <View className='bottom-btns'>
          <View className='del' onClick={this.delQrCode.bind(this)}>
            <Image className='icon' src='https://qn-qghotel.lindingtechnology.com/pcenter_1604566312619'></Image>
            <View className='icon-text'>删除</View>
          </View>
          <View className='edit' onClick={this.editQrInfo.bind(this)}>
            <Image className='icon' src='https://qn-qghotel.lindingtechnology.com/pcenter_1604543580582'></Image>
            <View className='icon-text'>编辑</View>
          </View>
          <View className='handle-btns'>
            <Button className='share' openType='share' >分享到微信</Button>
            <View className='save' onClick={this.saveToAlbum.bind(this)}>保存至相册</View>
          </View>
        </View>
      </View>
    )
  }

  render() {
    const { navBar } = Taro.getStorageSync('layout')
    const { status, canvasStatus, detailShow } = this.state
    return (
      <View className='qr-code' style={'padding-top: ' + navBar.height + 'px;'}>
        <Navbar title='编辑Wi-Fi信息' givenPage={'/pages/wifi-code/index'} textColor='#000000' bgColor='#ffffff' />
        <View className='body'>
          { canvasStatus && <Canvas type='2d' className='mycanvas' id='canvas'style='width: 281px; height: 394px;' />}
          { status === 'added' && this.renderNewQrInfo() }
          { status === 'edit' && this.renderEditQrInfo() }
          {/* { canvasStatus && <Canvas type='2d' id='canvas' className='mycanvas' style='width: 281px; height: 394px;opacity: 0;' />} */}
          { detailShow && this.renderSelectWifi() }
        </View>
      </View>
    )
  }
}
