import request from "../../utils/request";

//分页
export function getList(data) {
    const params = {
        currentPage: data.currentPage,
        pageSize: data.pageSize,
        status: data?.status
    }
    // 搜索条件（非空才传）
    if (data?.title) params.title = data.title
    if (data?.created_by_name) params.created_by_name = data.created_by_name
    if (data?.updated_by_name) params.updated_by_name = data.updated_by_name
    return request({
        url: 'GETdocumentsList',
        params,
        method: 'get'
    })
}

//新增
export function add(data) {
    return request({
        url: 'ADDdocuments',
        data,
        method: 'post'
    })
}

//删除
export function del(ids) {
    return request({
        url: `Removedocuments/${ids}`,
        method: 'delete'
    })
}

//彻底删除
export function Permanentlydelete(ids){
    return request({
        url: `/documents/${ids}/permanent`,
        method: 'delete'
    })
}

//新增文档成员
export function addMember(ids) {
    return request({
        url: `/ADDdocumentsMember/${ids}/members`,
        method: 'post',
        body:{}
    })
}

//从回收站恢复文档
export function restoreDocument(ids){
    return request({
        url:`/Restoredocuments/${ids}`,
        method:'put'
    })
}

//根据当前文档id获取成员列表
export function getMemberListByDocumentId(ids){
    return request({
        url:`/GETdocumentsMemberList/${ids}/members`,
        method:'get'
    })
}

//获取当前用户创建的文档列表
export function getDocumentListCreatedByCurrentUser(){
    return request({
        url:`/GETdocumentsListCreator`,
        method:'get'
    })
}

//修改文档权限
export function updateManageRule(data){
    return request({
        url:`/updateManageRule`,
        method:'post',
        data
    })
}

// 获取当前用户对文档的操作权限
export function getDocumentPermission(id){
    return request({
        url:`/GetDocumentMemberPermission/${id}`,
        method:'get'
    })
}