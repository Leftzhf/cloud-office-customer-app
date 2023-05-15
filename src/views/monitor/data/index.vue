<template>
  <div class="common-layout">
    <el-container>
      <el-header>
        <div class="card">
          <el-row :gutter="12">
            <el-col :span="8">
              <el-card shadow="always">客服在线人数:{{ this.countOnlineServer }}</el-card>
            </el-col>
            <el-col :span="8">
              <el-card shadow="always"> 当前在线访客: {{ this.countOnlineCustomer }}</el-card>
            </el-col>
            <el-col :span="8">
              <el-card shadow="always"> 当前会话总数: {{ this.countSession }}</el-card>
            </el-col>
          </el-row>
        </div>
      </el-header>
      <el-main>
        <div class="block">
          <span class="demonstration">筛选</span>
          <el-date-picker
            v-model="startDate"
            type="week"
            format="yyyy 第 WW 周"
            placeholder="选择周"
            @change="handleDatePicker()"
            :default-time="['00:00:00', '23:59:59']"
            :picker-options="{ firstDayOfWeek: 1 }"
          >
          </el-date-picker>
        </div>
        <div id="line-chart" style="width: 100%; height: 400px;"></div>
      </el-main>
    </el-container>
  </div>
</template>

<script>
import * as echarts from 'echarts'
import conversationApi from '@/api/conversation'

export default {
  name: 'LineChart',
  data() {
    return {
      startDate: 'Mon Apr 24 2023 00:00:00 GMT+0800', // 日期选择器，选择的起始日期
      timeQuery: {
        startTime: '', // 日期选择器，选择的结束日期
        endTime: '' // 日期选择器，选择的起始日期
      },
      countOnlineCustomer: 0, // 在线访客数
      onlineCustomerList: [], // 在线访客列表
      countOnlineServer: 0, // 在线客服数
      onlineServerList: [], // 在线客服列表
      countSession: 0, // 在线会话数
      serverToCustomers: [], // 客服-访客会话映射
      converSationSate: {},// 客服咨询统计折线图数据
      stateList: [], // 客服咨询统计折线图数据
      dateString: ''
    }
  },
  created() {
    this.initData()
  },
  mounted() {
    this.drawLineChart()
  },
  methods: {
    handleDatePicker() {
      this.getStartAndEndDate()
      console.log(`选择的起始日期：${this.timeQuery.startTime}\n结束日期${this.timeQuery.endTime}`)
      conversationApi.getConversationState(this.timeQuery).then(res => {
        console.log(`请求客服咨询统计折线图数据`)
        this.stateList = res.data
        this.drawLineChart()
      })
    },
    getStartAndEndDate() {
      const selectedDate = new Date(this.startDate)
      // 获取当前选中日期所在的周的周一日期
      this.timeQuery.startTime = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate() - selectedDate.getDay() + 1)

      // 获取当前选中日期所在的周的周日日期
      this.timeQuery.endTime = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate() - selectedDate.getDay() + 7, 23, 59, 59)
      // // 将起止日期转换成时间戳
      // const startTime = selectedDate.getTime()
      // const endTime = lastDayOfWeek.getTime()
    },
    drawLineChart() {
      const _this = this
      const myChart = echarts.init(document.getElementById('line-chart'))
      const option = {
        title: {
          text: '周客服咨询次数'
        },
        tooltip: {
          trigger: 'axis'
        },
        legend: {
          data: _this.stateList.map(item => item.stateByWeek.nickName)
        },
        grid: {
          left: '5%',
          right: '4%',
          bottom: '5%',
          containLabel: true
        },
        toolbox: {
          feature: {
            saveAsImage: {}
          }
        },
        xAxis: {
          type: 'category',
          boundaryGap: false,
          data: _this.stateList.map((item) => item.dateString)
        },
        yAxis: {
          type: 'value'
        },
        series: _this.stateList.reduce((series, item) => {
          const existingSeries = series.find(s => s.name === item.stateByWeek.nickName)
          if (existingSeries) {
            existingSeries.data.push(item.stateByWeek.countConverSationState)
          } else {
            series.push({
              name: item.stateByWeek.nickName,
              type: 'line',
              stack: 'Total',
              data: [item.stateByWeek.countConverSationState]
            })
          }
          return series
        }, [])
        // series: _this.stateList.map((item) => {
        //   // 遍历每个数据项，生成对应的series对象,按照item.stateByWeek.nickName分组
        //
        //   return {
        //     name: item.stateByWeek.nickName, // legend为nickName
        //     type: 'line',
        //     stack: 'Total',
        //     data: [item.stateByWeek.countConverSationState] // 纵坐标为countConverSationState
        //   }
        // })
      }
      myChart.setOption(option)
    },

    initData() {
      conversationApi.getOnlineConversation().then(res => {
        this.countSession = res.data.countSession
        this.serverToCustomers = res.data.countSession
        console.log(`请求在线会话列表`)
      })
      conversationApi.getListOnlineCustomer().then(res => {
        this.onlineCustomerList = res.data
        this.countOnlineCustomer = this.onlineCustomerList.length
        console.log(`请求当前在线访客列表`)
      })
      conversationApi.getListOnlineServer().then(res => {
        this.onlineServerList = res.data
        this.countOnlineServer = this.onlineServerList.length
        console.log(`请求当前在线客服列表`)
      })
      this.handleDatePicker()
    }
  }
}
</script>

<style>
/* 可以在这里添加CSS样式 */
</style>
