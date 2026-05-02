<template>
  <div class="add" style="margin-bottom: 20px;display: flex;gap: 20px;">
    <el-button type="primary" @click.prevent="addTableRecords">新增</el-button>
    <el-button type="primary" @click.prevent="openRecycleBin">回收站</el-button>
  </div>

  <div class="table-page">
    <el-table :data="tableData" border stripe style="width: 100%" row-key="id" v-loading="Loading" :header-cell-style="{
      backgroundColor: '#f1f5f9',
      color: '#303133',
      fontWeight: 500,
      textAlign: 'center'
    }">
      <el-table-column label="文档名称" prop="title" width="auto" align="center">
        <template #default="{ row }">
          <span class="goToEditor" @click="openDocument(row.id)">
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

      <el-table-column label="操作" fixed="right" width="auto" align="center">
        <template #default="scope">
          <div class="table-operate">
            <el-button type="success" @click="handleExport(scope.row)" class="button"> <el-icon class="el-icon--left">
                <Download />
              </el-icon>
              导出
            </el-button>

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
  </div>


  <!-- 新增弹窗 -->
  <el-dialog v-model="dialogVisible" width="calc(100vw * 400px / 1396px)" :before-close="handleClose">

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

  <!-- 分享 弹窗 -->
  <el-dialog v-model="shareDialogVisible" title="分享链接" width="calc(100vw * 400px / 1396px)"
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

  <RecycleBinDialog v-model="recycleBinDialogVisiable"></RecycleBinDialog>

</template>

<script setup>
import { ref, reactive, onBeforeUnmount } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Download, Delete, Share } from '@element-plus/icons-vue'
import { add, getList, del, addMember } from '../api/document.js'
import CryptoJS from 'crypto-js'
import { eventBus } from '../../utils/eventBus.js'
import RecycleBinDialog from './RecycleBinDialog.vue'

const tableData = ref([])
const Loading = ref(false)
const page = reactive({
  pageSize: 10,
  currentPage: 1,
  total: 0
})
const dialogVisible = ref(false)
const shareDialogVisible = ref(false)
const recycleBinDialogVisiable = ref(false)

const shareLink = ref('')
const options = ['新增', '加入']
const AddTypeValue = ref('新增')
const form = reactive({
  workspace_id: '测试工作区'
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
  console.log('导出数据：', row)
  ElMessage.success(`成功导出：${row.title}`)
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


const openDocument = (id) => {
  emits('ToEditor', { id })
}

const getDocumentList = async () => {
  try {
    Loading.value = true
    const res = await getList(page)
    tableData.value = res.data?.documents
    page.total = res.data?.total
    page.currentPage = res.data?.currentPage
    Loading.value = false
  } catch (error) {
    ElMessage.error(error)
  }
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
}

// 操作按钮样式
.table-operate {
  width: 100%;
  display: flex;
  flex-wrap: wrap;
}

.button {
  flex: 1;
  min-width: 0;
  font-size: 0.9vw !important;
}

.goToEditor {
  cursor: pointer;
}
</style>