import request from "../../utils/request";

//分页
export function chatWithDeepSeek(data) {
    return request({
        url: 'deepSeek/chat',
        data,
        method: 'post',
        responseType: 'stream'
    })
}
