import Taro from '@tarojs/taro'
import { get, post } from '@utils/request'

export function login() {
  return Taro.login()
    .then(({ code, errMsg }) => post('/wifis/login', { code })).then((data) => {
      Taro.setStorageSync('token', data.token)
      // console.log(data, '-=-=-')
      return data
    })
}

export async function isAdaptation() {
  // 获取当前的机型
  const { model } = await Taro.getSystemInfo()
  const reg = new RegExp('(iPhone 6)|(iPhone11)|(iPhone12)')
  const status = reg.test(model)
  return status
}

