import request from "../../utils/request";

/**
 * 获取当前用户的消息列表（支持分页）
 */
export function getNotifications(params = {}) {
  return request({
    url: 'notifications',
    params: { limit: params.limit || 20, skip: params.skip || 0 },
    method: 'get'
  })
}

/**
 * 获取未读消息总数
 */
export function getUnreadCount() {
  return request({
    url: 'notifications/unread-count',
    method: 'get'
  })
}

/**
 * 将所有消息标记为已读
 */
export function markAsRead() {
  return request({
    url: 'notifications/mark-as-read',
    method: 'post'
  })
}

/**
 * 删除当前用户的所有消息
 */
export function deleteAllNotifications() {
  return request({
    url: 'notifications',
    method: 'delete'
  })
}
