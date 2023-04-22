import request from '@/utils/request'

export default {
  /**
   * 获取带分页的常见问题列表
   * @param {Object} faqPageDto 分页常见问题列表查询条件
   */
  getFeedBackList(feedbackPageDto) {
    return request({
      url: '/api-management/feedback/list',
      method: 'post',
      data: feedbackPageDto
    })
  },

  /**
   * 新增常见问题
   * @param {Object} faqInfo 常见问题信息
   */
  addFeedBcak(feedBack) {
    return request({
      url: '/api-management/feedback/add',
      method: 'post',
      data: feedBack
    })
  },

  /**
   * 删除常见问题
   * @param {Number} faqId 常见问题编号
   */
  deleteFeedBack(feedBcakId) {
    return request({
      url: `/api-management/delete/{feedBcakId}`,
      method: 'delete'
    })
  },

  /**
   * 修改常见问题
   * @param {Object} faqInfo 常见问题信息
   */
  updateFaq(feedBack) {
    return request({
      url: '/api-management/feedback/update',
      method: 'put',
      data: feedBack
    })
  }
}
