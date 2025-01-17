import { createRouter, createWebHistory } from 'vue-router'
import CurrencyWidget from '../components/CurrencyWidget.vue'

const routes = [
  {
    path: '/',
    name: 'home',
    component: CurrencyWidget
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
