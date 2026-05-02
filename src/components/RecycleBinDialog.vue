<template>
    <div class="recycleBinDialogWrap">
        <el-dialog v-model="DialogVisible" title="回收站" width="calc(100vw * 400px / 1396px);" draggable
            @close="closeDialog">

            <el-table :data="tableData" border stripe row-key="id" v-loading="Loading" class="tableStyle"
                :header-cell-style="{
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
                            <el-button type="success" style="flex:1" @click="handleRestore(scope.row)" class="button">
                                恢复
                            </el-button>

                            <el-button type="danger" style="flex:2" @click="handleDelete(scope.row)" class="button">
                                彻底删除
                            </el-button>
                        </div>
                    </template>
                </el-table-column>
            </el-table>

        </el-dialog>
    </div>

</template>


<script setup>

import { computed, ref } from 'vue'
import { getList, restoreDocument, Permanentlydelete } from '../api/document.js'
import { ElMessage, ElMessageBox } from 'element-plus'
import { eventBus } from '../../utils/eventBus.js'

const tableData = ref([])
const Loading = ref(false)
const page = {
    currentPage: 1,
    pageSize: 10,
    total: 0
}

const props = defineProps({
    modelValue: {
        type: Boolean,
        default: false
    }
})

const emit = defineEmits(['update:modelValue'])

const DialogVisible = computed({
    get() {
        if (props.modelValue) {
            getDocumentList()
        }
        return props.modelValue
    },
    set(newVal) {
        emit('update:modelValue', newVal)
    }
})
const closeDialog = () => {
    DialogVisible.value = false
}

const handleRestore = async (data) => {
    try {
        await restoreDocument(data?.id)
        ElMessage.success('恢复成功')
        getDocumentList()
        eventBus.emit('updateDocumentRecord')

    } catch (error) {
        ElMessage.error(error)
    }
}

const handleDelete = async (data) => {
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
            await Permanentlydelete(data?.id)
            ElMessage.success('彻底删除成功')
            getDocumentList()

        } catch (error) {
            ElMessage.error(error)
        }
    })
}

const getDocumentList = async () => {
    try {
        Loading.value = true
        const res = await getList({ currentPage: page.currentPage, pageSize: page.pageSize, status: 'deleted' })
        Loading.value = false
        tableData.value = res.data?.documents
        page.total = res.data?.total
        page.currentPage = res.data?.currentPage
    } catch (error) {
        ElMessage.error(error)
    }
}

</script>

<style lang="css" scoped>
.tableStyle {
    height: calc(100vh * 300px / 621px);
    overflow-y: auto;
}

.table-operate {
    width: 100%;
    display: flex;
    flex-wrap: wrap;
}

.button {
    min-width: 0;
    font-size: 0.9vw !important;
}
</style>