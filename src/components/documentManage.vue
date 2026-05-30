<template>
  <div class="add" style="display: flex;gap: 20px;padding: 20px;">
    <el-button type="primary" @click.prevent="addTableRecords">新增</el-button>
    <el-button type="primary" @click.prevent="openRecycleBin">回收站</el-button>
  </div>

  <!-- 搜索条件（仅 PC） -->
  <div class="search-bar" v-if="!isMobile">
    <div class="search-item">
      <span class="search-label">文档名称</span>
      <el-input v-model="filters.title" placeholder="按名称搜索" clearable size="default" style="width:180px" @change="onSearch" />
    </div>
    <div class="search-item">
      <span class="search-label">创始人</span>
      <el-input v-model="filters.created_by_name" placeholder="按创始人搜索" clearable size="default" style="width:160px" @change="onSearch" />
    </div>
    <div class="search-item">
      <span class="search-label">更新人</span>
      <el-input v-model="filters.updated_by_name" placeholder="按更新人搜索" clearable size="default" style="width:160px" @change="onSearch" />
    </div>
    <el-button size="default" type="primary" @click="resetSearch">重置</el-button>
    <el-button size="default" type="primary" @click="onSearch">搜索</el-button>
  </div>

  <div class="table-page">
    <el-table :data="tableData" border stripe style="width: 100%" row-key="id" v-loading="Loading" :header-cell-style="{
      backgroundColor: '#f1f5f9',
      color: '#303133',
      fontWeight: 500,
      textAlign: 'center'
    }"
    height="calc(100% - 40px)"
    >
      <el-table-column label="文档名称" prop="title" width="auto" align="center">
        <template #default="{ row }">
          <span class="goToEditor" @click="openDocument(row)">
            {{ row.title }}
          </span>
        </template>
      </el-table-column>

      <el-table-column label="创始人" prop="created_by_name" width="auto" align="center" />

      <el-table-column label="更新人" prop="updated_by_name" width="auto" align="center" />

      <el-table-column label="更新时间" prop="updated_at" width="auto" align="center">
        <template #default="scope">
          {{ scope.row.updated_at ? new Date(scope.row.updated_at).toLocaleString() : '-' }}
        </template>
      </el-table-column>

      <el-table-column label="操作" fixed="right" width="140px" align="center">
        <template #default="scope">
          <div class="table-operate">
            <el-button type="primary" @click="handleShare(scope.row)" class="button">
              <el-icon class="el-icon--left">
                <Share />
              </el-icon>
              分享
            </el-button>

            <el-button type="danger" @click="handleDelete(scope.row)" class="button">
              <el-icon class="el-icon--left">
                <Delete />
              </el-icon>
              删除
            </el-button>
          </div>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页器（仅 PC） -->
    <div class="pagination-wrap" v-if="!isMobile">
      <el-pagination
        v-model:current-page="page.currentPage"
        v-model:page-size="page.pageSize"
        :page-sizes="[5, 10, 20, 50]"
        :total="page.total"
        layout="sizes, prev, pager, next"
        background
        small
        @current-change="getDocumentList"
        @size-change="getDocumentList"
      />
    </div>
  </div>


  <!-- 新增弹窗（PC：el-dialog / 手机：MobileDialog） -->
  <el-dialog v-if="!isMobile" v-model="dialogVisible" width="calc(100vw * 400px / 1396px)" class="responsive-dialog" :before-close="handleClose">

    <template #header>
      <el-segmented v-model="AddTypeValue" :options="options" />
    </template>


    <el-form :model="form" label-width="auto" style="max-width: 600px">
      <div class="addDocument" v-if="AddTypeValue === '新增'">
        <el-form-item label="文档名称">
          <el-input v-model="form.title" />
        </el-form-item>

        <el-form-item label="工作区名称">
          <el-input v-model="form.workspace_id" :disabled="true" />
        </el-form-item>
      </div>

      <div class="joinDocument" v-else>
        <el-form-item label="文档编码">
          <el-input v-model="form.document_id" />
        </el-form-item>
      </div>

    </el-form>
    <template #footer>
      <div class="dialog-footer">
        <el-button type="primary" @click="comformBtnClick">确认</el-button>
        <el-button @click="handleClose">
          取消
        </el-button>
      </div>
    </template>
  </el-dialog>

  <MobileDialog
    v-if="isMobile"
    v-model="dialogVisible"
    type="add"
    @confirm="onMobileDialogConfirm"
  />

  <!-- 分享弹窗（PC：el-dialog / 手机：MobileDialog） -->
  <el-dialog v-if="!isMobile" v-model="shareDialogVisible" width="calc(100vw * 400px / 1396px)" title="分享链接" class="responsive-dialog"
    @close="shareDialogVisible = false">
    <span>{{ shareLink }}</span>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="shareDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleCopy">
          复制到剪贴板
        </el-button>
      </div>
    </template>
  </el-dialog>

  <MobileDialog
    v-if="isMobile"
    v-model="shareDialogVisible"
    type="share"
    :share-link="shareLink"
  />

  <RecycleBinDialog v-if="!isMobile" v-model="recycleBinDialogVisiable"></RecycleBinDialog>
  <MobileRecycleBin v-if="isMobile" v-model="recycleBinDialogVisiable"></MobileRecycleBin>

</template>

<script setup>
import { ref, reactive, onBeforeUnmount, onUnmounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Download, Delete, Share } from '@element-plus/icons-vue'
import { add, getList, del, addMember } from '../api/document.js'
import CryptoJS from 'crypto-js'
import { eventBus } from '../../utils/eventBus.js'
import RecycleBinDialog from './RecycleBinDialog.vue'
import MobileDialog from './MobileDialog.vue'
import MobileRecycleBin from './MobileRecycleBin.vue'

const tableData = ref([])
const Loading = ref(false)
const page = reactive({
  pageSize: 10,
  currentPage: 1,
  total: 0
})
const filters = reactive({
  title: '',
  created_by_name: '',
  updated_by_name: ''
})
const dialogVisible = ref(false)
const shareDialogVisible = ref(false)
const recycleBinDialogVisiable = ref(false)

// 移动端检测（与组件内媒体查询一致）
const isMobile = ref(window.innerWidth <= 768)
function onResize() {
  isMobile.value = window.innerWidth <= 768
}
window.addEventListener('resize', onResize)
onBeforeUnmount(() => window.removeEventListener('resize', onResize))

const shareLink = ref('')
const options = ['新增', '加入']
const AddTypeValue = ref('新增')
const form = reactive({
  workspace_id: '测试工作区'
})


const handleDocDeleted = (notif) => {
    if ( notif.action !== 'Cdelete') {
      getDocumentList()
    }
  }
eventBus.on('notification:new', handleDocDeleted)

onUnmounted(()=>{
  eventBus.off('notification:new')
})

/**
 * AES 加密
 */
function encrypt(data) {

  const text = JSON.stringify(data)
  const key = CryptoJS.enc.Utf8.parse(import.meta.env.VITE_AES_KEY)
  const iv = CryptoJS.enc.Utf8.parse(import.meta.env.VITE_AES_IV)
  const encrypted = CryptoJS.AES.encrypt(
    CryptoJS.enc.Utf8.parse(text),
    key,
    {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    }
  )
  return encodeURIComponent(encrypted.toString())
}

const emits = defineEmits(['ToEditor'])
const handleExport = (row) => {
  // 打开编辑器，用户可在编辑器中点击「导出 PDF」按钮
  openDocument(row)
  ElMessage.info('请先在编辑器中查看文档，然后点击工具栏的「导出 PDF」按钮')
}

const addTableRecords = () => {
  dialogVisible.value = true
}

const openRecycleBin = () => {
  recycleBinDialogVisiable.value = true
}

const comformBtnClick = async () => {
  if (AddTypeValue.value === '新增') {
    try {
      await add({ workspace_id: form?.workspace_id, title: form?.title })
      ElMessage.success('新增成功')

    } catch (error) {
      ElMessage.error(error)
    }

  }
  else {
    try {
      await addMember(form.document_id)
      ElMessage.success('加入成功')
    }
    catch (error) {
      ElMessage.error(error)
    }
  }
  getDocumentList()
  handleClose()

}

const handleClose = () => {
  form.document_id = '',
    form.title = '',
    dialogVisible.value = false
}

const handleDelete = (row) => {
  ElMessageBox.confirm(
    '此操作将永久删除该文档, 是否继续?',
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      await del(row.id)
      ElMessage.success('删除成功！')
      getDocumentList()
    } catch (error) {
      ElMessage.error(error)
    }
  })

}
const handleShare = (data) => {
  shareLink.value = encrypt({ document_id: data.id, title: data.title })
  shareDialogVisible.value = true
}

const handleCopy = async () => {
  try {
    if (!shareLink.value) {
      ElMessage.warning('无内容可复制')
      return
    }

    await navigator.clipboard.writeText(shareLink.value);

    ElMessage.success('复制成功！')
    shareDialogVisible.value = false
  } catch (error) {
    ElMessage.error(error)
  }
}


/** 手机端新增/加入弹窗确认 */
const onMobileDialogConfirm = async (data) => {
  try {
    if (data.addType === '新增') {
      await add({ workspace_id: data.workspace_id, title: data.title })
    } else {
      await addMember(data.document_id)
    }
    ElMessage.success(data.addType === '新增' ? '新增成功' : '加入成功')
    getDocumentList()
  } catch (error) {
    // 错误由 request 拦截器统一处理
    console.error(error)
  }
}

const openDocument = (row) => {
  emits('ToEditor', { id: row.id, title: row.title })
}

const getDocumentList = async () => {
  try {
    Loading.value = true
    const res = await getList({
      ...page,
      title: filters.title || undefined,
      created_by_name: filters.created_by_name || undefined,
      updated_by_name: filters.updated_by_name || undefined
    })
    tableData.value = res.data?.documents
    page.total = res.data?.total
    page.currentPage = res.data?.currentPage
    Loading.value = false
  } catch (error) {
    ElMessage.error(error)
  }
}

// 搜索时回到第一页
const onSearch = () => {
  page.currentPage = 1
  getDocumentList()
}

// 重置搜索条件
const resetSearch = () => {
  filters.title = ''
  filters.created_by_name = ''
  filters.updated_by_name = ''
  page.currentPage = 1
  getDocumentList()
}

getDocumentList()
eventBus.on('updateDocumentRecord', () => {
  console.log("监听到数据改变开始更新列表")
  getDocumentList()
})
onBeforeUnmount(() => {
  eventBus.off('updateDocumentRecord')
})
</script>

<style lang="scss" scoped>
.table-page {
  width: 100%;
  box-sizing: border-box;
  position: relative;
  padding: 0 20px;
  height: calc(100% - 120px);
}

// 操作按钮样式
.table-operate {
  width: 100%;
  display: flex;
  flex-wrap: wrap;
  gap:10px;
}

.button {
  flex: 1;
  min-width: 0;
  font-size: clamp(12px, 0.9vw, 14px) !important;
  margin-left: 0 !important;
}

.goToEditor {
  cursor: pointer;
}

/* ===== 搜索条件栏 ===== */
.search-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 20px 16px;
  flex-wrap: wrap;
}

.search-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.search-label {
  font-size: 13px;
  color: #475569;
  font-weight: 500;
  white-space: nowrap;
}

/* ===== 分页器 ===== */
.pagination-wrap {
  display: flex;
  justify-content: flex-end;
  padding: 16px 0 0;
}
</style>

<!-- 非 scoped 样式：穿透 el-dialog teleport -->
<style>
.responsive-dialog {
  --el-dialog-width: 420px;
}
</style>