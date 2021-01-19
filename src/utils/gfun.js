import Taro from '@tarojs/taro'
import appConfig from '../app.config'

export function price2point(price) {
  return parseFloat(price / 100).toFixed(2)
}

// 如果 includeOtherType=true 包含0，false，undefined，如果为 false 只包含{}
export function isEmptyObject(obj, includeOtherType = false) {
  return (includeOtherType && !obj) || JSON.stringify(obj) === '{}'
}

// 手机号校验
export function checkPhoneNumber(input) {
  return /^[1][3,4,5,7,8][0-9]{9}$/.test(input)
}

// 判断是否是数组
export function isArray(input) {
  return input && typeof input === 'object' && input.constructor === Array
}

// json对象转成key-value格式，目前仅支持属性为纯字符串的，如果不是字符串先转json字符串再处理
export function json2kv(json) {
  const kvStrArr = []
  for (const key in json) {
    if (json.hasOwnProperty(key)) {
      let item = json[key]
      if (typeof item === 'function') continue
      if (typeof item === 'object') {
        item = JSON.stringify(item)
      }

      kvStrArr.push(`${key}=${item}`)
    }
  }
  return kvStrArr.join('&')
}

// 订阅
export async function subscribe(tmplIds) {
  if (!tmplIds) return
  const ids = isArray(tmplIds) ? tmplIds : [tmplIds]
  // const subscribeIds = Taro.getStorageSync('subscribeIds') || []
  // const handleIds = ids.filter(item => subscribeIds.indexOf(item) === -1)
  // Taro.setStorageSync('subscribeIds', subscribeIds.concat(handleIds))
  // if (handleIds.length === 0) return

  return new Promise((resolve, reject) => {
    wx.requestSubscribeMessage({
      tmplIds: ids,
      success(res) {
        resolve(res)
      },
      fail(res) {
        reject(res)
      }
    })
  })
}

export function getQueryString(url, name) {
  const reg = new RegExp('(^|&)' + name + '=([^&]*)(&|$)', 'i')
  const r = url.match(reg)
  return r != null ? unescape(r[2]) : null
}

