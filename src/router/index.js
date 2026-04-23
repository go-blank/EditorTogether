import { createRouter, createWebHistory } from 'vue-router'

import Login from '../pages/login.vue'
import Home from '../pages/home.vue'

function isAuthed() {
  try {
    return Boolean(localStorage.getItem('et_user'))
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

router.beforeEach((to) => {
  if (to.meta?.requiresAuth && !isAuthed()) return '/login'
})

export default router

