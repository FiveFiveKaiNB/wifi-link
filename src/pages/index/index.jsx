import Nerv, { Component } from 'nervjs'
import Taro from '@tarojs/taro'
import { View, Text, Canvas, Button } from '@tarojs/components'
import './index.scss'

export default class Index extends Component {
  componentDidMount() {
  }

  initCanvas() {
    const that = this
    const query = Taro.createSelectorQuery()
    query.select('#canvas')
      .fields({ node: true, size: true })
      .exec(async(res) => {
        const canvas = res[0].node
        const ctx = canvas.getContext('2d')
        const dpr = Taro.getSystemInfoSync().pixelRatio
        canvas.width = 281 * dpr
        canvas.height = 394 * dpr
        ctx.scale(dpr, dpr)

        console.log(canvas.width, '-=-=-=-=-=')
        const width = wx.getSystemInfoSync().screenWidth
        setTimeout(() => {
          ctx.save()
          // ctx.textAlign = 'center'

          ctx.font = '14px'
          ctx.fillStyle = '#1B1B1B'

          ctx.fillText('askjdhasiuhdih', (width - ctx.measureText('askjdhasiuhdih').width) * 0.5, 310)

          ctx.fillStyle = '#A5A5A5'
          ctx.fillText('askjdhasiuhdih', 0, 330)

          ctx.restore()
        }, 200)
      })
  }

  onclikBtn() {
    this.initCanvas()
  }

  render() {
    return (
      <View className='index'>
        <Canvas type='2d' id='canvas' className='canvas' style='width: 562rpx; height: 788rpx' />
        <Button onClick={this.onclikBtn.bind(this)}>点击一下</Button>
      </View>
    )
  }
}
