import Taro from '@tarojs/taro'

export function initTabBarData(weappConfigs) {
  const app = Taro.getApp()
  if (!app.config.tabBar.list[0].text) {
    weappConfigs.map((item, index) => {
      Taro.setTabBarItem({
        index,
        text: item.text,
        iconPath: item.icon,
        selectedIconPath: item.selectedIcon,
        fail: (err) => {
          console.error(err, '====-=-=')
        }
      })
    })
  }
}

