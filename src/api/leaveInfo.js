import request from '@/utils/request'

export default {
  /**
   * 获取带分页的常见问题列表
   * @param {Object} faqPageDto 分页常见问题列表查询条件
   */
  getLeaveInfoList(leaveInfoPageDto) {
    return request({
      url: '/api-management/leaveInfo/list',
      method: 'post',
      data: leaveInfoPageDto
    })
  },

  /**
   * 新增常见问题
   * @param {Object} faqInfo 常见问题信息
   */
  addLeaveInfo(leaveInfo) {
    return request({
      url: '/api-management/leaveInfo/add',
      method: 'post',
      data: leaveInfo
    })
  },

  /**
   * 删除常见问题
   * @param {Number} faqId 常见问题编号
   */
  deleteLeaveInfo(leaveInfoId) {
    return request({
      url: `/api-management/leaveInfo/delete/${leaveInfoId}`,
      method: 'delete'
    })
  },

  /**
   * 修改常见问题
   * @param {Object} faqInfo 常见问题信息
   */
  updateLeaveInfo(leaveInfo) {
    return request({
      url: '/api-management/leaveInfo/update',
      method: 'put',
      data: leaveInfo
    })
  }
}
