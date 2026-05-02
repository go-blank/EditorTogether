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
        url:`/Restoredocuments/${ids}`,
        method:'put'
    })
}

