<template>

  <div class="add" style="margin-bottom: 20px;">
    <el-button type="primary">新增</el-button>
  </div>
  <div class="table-page">
    <el-table :data="tableData" border stripe style="width: 100%" row-key="id" :header-cell-style="{
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

      <el-table-column label="创始人" prop="creater" width="auto" align="center" />

      <el-table-column label="更新人" prop="updater" width="auto" align="center" />

      <el-table-column label="更新时间" prop="updateTime" width="auto" align="center" />

      <el-table-column label="操作" fixed="right" width="auto" align="center">
        <template #default="scope">
          <div class="table-operate">
            <el-button type="success" small @click="handleExport(scope.row)" class="button"> <el-icon
                class="el-icon--left">
                <Download />
              </el-icon>
              导出
            </el-button>

            <el-button type="danger" small @click="handleDelete(scope.row)" class="button">
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
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Download, Delete } from '@element-plus/icons-vue'

const tableData = ref([
  {
    id: 1,
    title: '协作文档测试版',
    creater: '张三',
    updater: '李四',
    updateTime: '2025-05-20 14:30:22'
  },
  {
    id: 2,
    title: '产品需求文档V2.0',
    creater: '王五',
    updater: '赵六',
    updateTime: '2025-05-21 09:15:10'
  },
  {
    id: 3,
    title: '前端技术方案',
    creater: '小明',
    updater: '小红',
    updateTime: '2025-05-22 16:40:05'
  }
])

const emits = defineEmits(['ToEditor'])
const handleExport = (row) => {
  console.log('导出数据：', row)
  ElMessage.success(`成功导出：${row.title}`)
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(
      '此操作将永久删除该文档, 是否继续?',
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    tableData.value = tableData.value.filter(item => item.id !== row.id)
    ElMessage.success('删除成功！')
  } catch (error) {
    ElMessage.info('已取消删除')
  }
}

const openDocument = (id) => {
  emits('ToEditor', { id })
}
</script>

<style lang="scss" scoped>
.table-page {
  width: 100%;
  box-sizing: border-box;
}

// 操作按钮样式
.table-operate {
  display: flex;
  gap: 10px;
  justify-content: space-around;

  font-size: 12px;
}

.button {
  width: 70px;
  height: 30px;
}

.goToEditor {
  cursor: pointer;
}
</style>