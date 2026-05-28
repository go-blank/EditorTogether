import request from "../../utils/request";

//分页
export function getList(data) {
    return request({
        url: 'GETdocumentsList',
        params: {
            currentPage: data.currentPage,
            pageSize: data.pageSize,
            status:data?.status
        },
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
        url:`/Restoredocusments/${ids}`,
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