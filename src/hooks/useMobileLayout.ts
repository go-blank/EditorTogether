import { ref, onMounted, onUnmounted } from 'vue'

/**
 * 移动端布局 composable
 * - 通过媒体查询检测是否为手机屏幕（≤768px）
 * - 管理手机模式下「菜单页」与「内容页」的切换状态
 *
 * PC / 平板模式下 showMenu 始终为 true（侧栏和内容区并排），不影响现有布局
 */
export function useMobileLayout() {
  const isMobile = ref(false)
  const showMenu = ref(true)

  let mql: MediaQueryList | null = null

  function updateMatch(e) {
    isMobile.value = e.matches
    // PC 模式下侧栏始终可见
    if (!e.matches) {
      showMenu.value = true
    }
  }

  onMounted(() => {
    mql = window.matchMedia('(max-width: 768px)')
    updateMatch(mql)
    mql.addEventListener('change', updateMatch)
  })

  onUnmounted(() => {
    if (mql) {
      mql.removeEventListener('change', updateMatch)
    }
  })

  /** 从菜单进入某个功能组件 */
  function goToComponent() {
    if (isMobile.value) {
      showMenu.value = false
    }
  }

  /** 从组件返回主菜单 */
  function goBack() {
    showMenu.value = true
  }

  return { isMobile, showMenu, goToComponent, goBack }
}
