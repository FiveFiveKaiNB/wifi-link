import Taro from '@tarojs/taro'
import { login } from '@utils/auth'
const requestStatus = {}

async function getToken() {
  const url = API_HOST + '/wifis/login'
  const { code } = await Taro.login()
  const { data: { data: { token, user }}} = await Taro.request({
    url,
    data: { code, member: Taro.getStorageSync('appType') },
    method: 'POST',
    header: {
      'client': 'miniProgram',
      'content-type': 'application/json' // 默认值
    }
  })
  Taro.setStorageSync('token', token)
  Taro.setStorageSync('userInfo', user)
  return token
}

const whiteList = ['/wifis/login']

/**
 * @param {统一请求方法} path
 * @param {*} method
 * @param {*} data
 */
export async function request(path, method = 'GET', data = {}) {
  // 请求保护，避免同一个请求重复请求
  // if (requestStatus[path]) return
  if (requestStatus[path]) {
    return Promise.reject(`请勿发起重复请求！路径为--------${path}`)
  }
  requestStatus[path] = true
  // retryCheck(path) && setTimeout(() => request(path, method, data), 1000)
  let token = Taro.getStorageSync('token')
  // 如果没有token 那么就先去拿token
  if (!token && whiteList.indexOf(path) === -1) {
    console.log(path, '-=-=-=-=-=-=-path')
    token = await getToken()
  }
  const header = {
    'client': 'miniProgram',
    'content-type': 'application/json'
  }
  token && (header.authorization = `Bearer ${token}`)

  return new Promise((resolve, reject) => {
    const url = API_HOST + path

    return Taro.request({
      url,
      method,
      data,
      header
    }).then(async({ statusCode, errMsg, data }) => {
      requestStatus[path] = false
      if (statusCode === 400 && data.code === 43001) {
        resolve(data.data)
      }
      if (statusCode !== 200) {
        console.error('http no 200', data.msg)
        reject(data.msg)
      }
      if (data.code === 40001 || data.code === 40002 || data.code === 40003) {
        console.error('权限验证失败: ', data.msg)
        Taro.removeStorageSync('token')
        setTimeout(async() => {
          await login()
        }, 1000)
        reject(data.msg)
      }
      if (data.code !== 20000) {
        console.error('code no 20000', data.msg)
        reject(data.msg)
      }
      resolve(data.data)
    }).catch(error => {
      requestStatus[path] = false
      reject(error)
    })
  })
}

export function get(url, data) {
  return request(url, 'GET', data)
}

export function post(url, data) {
  return request(url, 'POST', data)
}

export function put(url, data) {
  return request(url, 'PUT', data)
}

export function del(url, data) {
  return request(url, 'DELETE', data)
}
