<template>

    <div class="recycleBinDialogWrap">
        <el-dialog v-model="DialogVisible" title="分享链接" width="calc(100vw * 400px / 1396px)" @close="closeDialog">

        </el-dialog>
    </div>

</template>


<script setup>

import { computed } from 'vue'

const props = defineProps({
    modelValue: {
        type: Boolean,
        default: false
    }
})

const emit = defineEmits(['update:modelValue'])

const DialogVisible = computed({
    get() {
        return props.modelValue
    },
    set(newVal) {
        emit('update:modelValue', newVal)
    }
})
const closeDialog = () => {
    DialogVisible.value = false
}

</script>

<style lang="css" scoped></style>