import request from '@/utils/request'

export default {
  /**
   * 获取会话列表
   * @param userId 用户编号
   * @returns {AxiosPromise}
   */
  getConversationList(userId) {
    return request({
      url: `/api-im/conversation/list/${userId}`,
      method: 'get'
    })
  },
  getListOnlineServer() {
    return request({
      url: `/api-im/conversation/list/online/user`,
      method: 'get'
    })
  },
  createConversation(conversationDTO) {
    return request({
      url: `/api-im/conversation/list/online/user`,
      method: 'put',
      data: conversationDTO
    })
  }
}
