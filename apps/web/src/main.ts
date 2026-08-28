import { createApp, h } from 'vue'
import { createPinia } from 'pinia'
import './style.css'
import App from './App.vue'
import { withNaiveProviders } from '@/app/config/naive-ui'
import router from './app/router'

const app = createApp({
  render: () => withNaiveProviders(h(App)),
})

app.use(createPinia()).use(router).mount('#app')
