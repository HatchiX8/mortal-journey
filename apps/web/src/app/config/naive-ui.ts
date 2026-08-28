import { h, type VNodeChild } from 'vue'
import {
  darkTheme,
  dateZhTW,
  NConfigProvider,
  NDialogProvider,
  NLoadingBarProvider,
  NMessageProvider,
  NNotificationProvider,
  zhTW,
  type GlobalThemeOverrides,
} from 'naive-ui'

export const naiveThemeOverrides: GlobalThemeOverrides = {}

export function withNaiveProviders(children: VNodeChild) {
  return h(
    NConfigProvider,
    {
      theme: darkTheme,
      locale: zhTW,
      dateLocale: dateZhTW,
      themeOverrides: naiveThemeOverrides,
    },
    {
      default: () =>
        h(NLoadingBarProvider, null, {
          default: () =>
            h(NNotificationProvider, null, {
              default: () =>
                h(NDialogProvider, null, {
                  default: () => h(NMessageProvider, null, { default: () => children }),
                }),
            }),
        }),
    },
  )
}
