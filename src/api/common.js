import request from '@/utils/request'

export default {

  /**
   * 获取省市列表
   */
  getProvinceCityList() {
    return request({
      url: '/api-dictionary/common/city',
      method: 'get'
    })
  },

  /**
   * 获取行业列表
   */
  getIndustryList() {
    return request({
      url: '/api-dictionary/common/industry',
      method: 'get'
    })
  }

}
