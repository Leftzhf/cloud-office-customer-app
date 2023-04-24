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
      url: `/api-im/conversation/list/online/server`,
      method: 'get'
    })
  },
  getListOnlineServerByTeamId(teamId) {
    return request({
      url: `/api-im/conversation/list/online/server/${teamId}`,
      method: 'get'
    })
  },
  createConversation(conversationDTO) {
    return request({
      url: `/api-im/conversation/create`,
      method: 'put',
      data: conversationDTO
    })
  },
  updateConversationEnd(conversationId) {
    return request({
      url: `/api-im/conversation/update/end/${conversationId}`,
      method: 'post'
    })
  }
}
