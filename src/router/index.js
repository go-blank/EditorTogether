import { createRouter, createWebHistory } from 'vue-router'

import Login from '../pages/login.vue'
import Home from '../pages/home.vue'
import { getUserInfo } from '../api/user.js'

function isAuthed() {
  try {
    return Boolean(localStorage.getItem('token'))
  } catch {
    return false
  }
}

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: () => (isAuthed() ? '/app' : '/login') },
    { path: '/login', component: Login },
    { path: '/app', component: Home, meta: { requiresAuth: true } },
  ],
})

const whiteList = ['/login']

router.beforeEach((to, from, next) => {
  // debugger
  if (to.meta?.requiresAuth && !isAuthed()) {
    // 需要认证 但无token
    next('/login')
  } else if (to.path === '/login' && isAuthed()) {
    // 已认证，访问登录页时跳转到 app
    next('/app')
  } else {
    const userInfo = localStorage.getItem('user')
    if (!userInfo && !whiteList.includes(to.path)) {
      getUserInfo().then(res => {
        localStorage.setItem('user', JSON.stringify(res?.data))
        next()
      })
    }
    else {
      next()
    }
  }
})

export default router

