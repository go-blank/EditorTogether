<template>
    <div class="member-manage">
        <div class="header">
            <h3 class="header-title">文档成员权限管理</h3>
            <el-button type="primary" size="small" @click="loadData" :loading="loading">
                刷新
            </el-button>
        </div>

        <el-table v-loading="loading" :data="tableData" border style="width: 100%" :span-method="objectSpanMethod"
            :header-cell-style="{ background: '#f5f7fa', color: '#303133', fontWeight: 700 }" empty-text="暂无已创建的文档或成员">
            <el-table-column prop="title" label="文档名称" min-width="180" />
            <el-table-column prop="username" label="用户信息" min-width="150" />
            <el-table-column label="读权限控制" min-width="120" align="center">
                <template #default="{ row }">
                    <el-switch :model-value="true" disabled />
                </template>
            </el-table-column>
            <el-table-column label="写权限控制" min-width="120" align="center">
                <template #default="{ row }">
                    <el-switch v-model="row.writePerm" @change="onPermChange(row, 'write')" />
                </template>
            </el-table-column>
        </el-table>
    </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { getMemberListByDocumentId, getDocumentListCreatedByCurrentUser, updateManageRule } from '../api/document.js'
import { ElMessage } from 'element-plus'

const loading = ref(false)
const tableData = ref([])
const documents = ref([])

const onPermChange = async (row, type) => {
    console.log("111111111", row)

    const data = {
        documentId: row?.docId,
        userId: row?.userId,
        write: row?.writePerm
    }

    try {
        const res = await updateManageRule(data)
        if (res.success) {
            ElMessage.success('修改成功')
        }
    } catch (error) {
        console.log(error)
    }


}
const loadData = async () => {
    loading.value = true
    try {
        const res = await getDocumentListCreatedByCurrentUser()
        const docs = res.data?.documents || []

        if (docs.length === 0) {
            tableData.value = []
            return
        }

        // 并发获取每个文档的成员列表
        const membersResults = await Promise.all(
            docs.map(doc =>
                getMemberListByDocumentId(doc.id)
                    .then(membersRes => ({
                        docId: doc.id,
                        title: doc.title,
                        members: membersRes.data || []
                    }))
                    .catch(() => ({
                        docId: doc.id,
                        title: doc.title,
                        members: []
                    }))
            )
        )

        // 展平为表格数据
        const flat = []
        for (const item of membersResults) {
            for (const member of item.members) {
                flat.push({
                    docId: item.docId,
                    title: item.title,
                    userId: member.user_id,
                    username: member.username,
                    readPerm: member.readPerm,
                    writePerm: member.writePerm
                })
            }
        }

        tableData.value = flat
    } catch (error) {
        console.error('加载数据失败', error)
        tableData.value = []
    } finally {
        loading.value = false
    }
}

// 计算合并行的信息
const spanInfo = computed(() => {
    const result = []
    const data = tableData.value
    if (data.length === 0) return result

    let i = 0
    while (i < data.length) {
        let count = 1
        for (let j = i + 1; j < data.length && data[j].docId === data[i].docId; j++) {
            count++
        }
        result.push({ startIndex: i, rowspan: count })
        i += count
    }
    return result
})

const objectSpanMethod = ({ rowIndex, columnIndex }) => {
    if (columnIndex === 0) {
        const info = spanInfo.value.find(item => item.startIndex === rowIndex)
        if (info) {
            return { rowspan: info.rowspan, colspan: 1 }
        }
        return { rowspan: 0, colspan: 0 }
    }
}

const handleSwitchChange = () => {
    // 切换开关的逻辑目前保持本地状态
    // TODO: 后续对接后端接口保存权限变更
}

loadData()
</script>

<style scoped>
.member-manage {
    padding: 16px;
    height: 100%;
    display: flex;
    flex-direction: column;
}

.header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
}

.header-title {
    margin: 0;
    font-size: 16px;
    font-weight: 700;
    color: #1a1a2e;
}
</style>
