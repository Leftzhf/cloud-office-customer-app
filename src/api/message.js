import request from '@/utils/request'

export default {
  /**
   * 获取消息列表
   * @param messageListDto 查询条件
   * @returns {AxiosPromise}
   */
  getMessagePage(messageListDto) {
    return request({
      url: '/api-im/message/listPage',
      method: 'post',
      data: messageListDto
    })
  },
  getMessageList(messageListDto) {
    return request({
      url: '/api-im/message/list',
      method: 'post',
      data: messageListDto
    })
  },
  recallMessage(messageDto) {
    return request({
      url: '/api-im/message/recall',
      method: 'post',
      data: messageDto
    })
  }
}
