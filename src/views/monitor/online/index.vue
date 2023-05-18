<template>
  <div class="common-layout">
    <el-container>
      <el-header>
        <div class="card" style="margin-top: 10px;">
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
        <div class="block" style="margin: 8px; 0px;">
          <span class="demonstration" style="margin-right: 6px;">筛选</span>
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
        <div class="e-chart-box">
          <div id="line-chart"></div>
          <div id="bar-chart"></div>
        </div>

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
      barStateList: [],
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
      converSationSate: {}, // 客服咨询统计折线图数据
      stateList: [], // 客服咨询统计折线图数据
      dateString: []
    }
  },
  created() {
    this.initData()
  },
  mounted() {
    this.drawLineChart()
    this.drawBarChart()
  },
  methods: {
    handleDatePicker() {
      this.getStartAndEndDate()
      const _this = this
      console.log(`选择的起始日期：${this.timeQuery.startTime}\n结束日期${this.timeQuery.endTime}`)
      // 画折线图
      conversationApi.getConversationState(this.timeQuery).then(res => {
        console.log(`请求客服咨询统计折线图数据`)
        _this.dateString = res.data.dateString
        _this.stateList = res.data.stateByWeek
        _this.drawLineChart()
      })
      // 画饼图
      conversationApi.getConversationBarState(this.timeQuery).then(res => {
        console.log(`请求客服咨询统计饼图数据`)
        _this.barStateList = res.data
        _this.drawBarChart()
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
          text: '客服接待情况'
        },
        tooltip: {
          trigger: 'axis'
        },
        legend: {
          data: [...new Set(_this.stateList.flatMap(item2 => item2.nickName))]

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
          data: _this.dateString
        },
        yAxis: {
          type: 'value'
        },
        series: _this.stateList.map(item => {
          return {
            name: item.nickName,
            type: 'line',
            stack: '总量',
            data: item.countConverSationState
          }
        })
      }
      // debugger
      myChart.setOption(option)
    },
    drawBarChart() {
      const _this = this
      const myChart = echarts.init(document.getElementById('bar-chart'))
      const option = {
        title: {
          text: '访客来访情况',
          subtext: 'Fake Data',
          left: 'center'
        },
        tooltip: {
          trigger: 'item'
        },
        legend: {
          orient: 'vertical',
          left: 'left'
        },
        series: [
          {
            name: 'Access From',
            type: 'pie',
            radius: '50%',
            data: _this.barStateList,
            emphasis: {
              itemStyle: {
                shadowBlur: 10,
                shadowOffsetX: 0,
                shadowColor: 'rgba(0, 0, 0, 0.5)'
              }
            }
          }
        ]
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
.demonstration {

}

.e-chart-box {
  display: flex;
  justify-content: space-around;
  margin-top: 20px;
}

#line-chart {
  padding: 12px;
  box-sizing: border-box;
  width: 45%;
  height: 700px;
  /*border: 1px solid red;*/
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, .1);
}

#bar-chart {
  /*border: 1px solid red;*/
  width: 45%;
  height: 700px;
  padding: 12px;
  box-sizing: border-box;
  /*width: 40%; height: 700px;*/
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, .1);
}
</style>
