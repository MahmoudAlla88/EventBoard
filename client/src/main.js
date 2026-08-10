import { createApp } from 'vue'
import { VueQueryPlugin } from '@tanstack/vue-query'
import './style.css'
import App from './App.vue'
import { router } from './router'
import { pinia } from './store'

createApp(App).use(pinia).use(router).use(VueQueryPlugin).mount('#app')
