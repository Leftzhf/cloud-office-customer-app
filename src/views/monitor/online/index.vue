<template>
  <div class="app-container">
    <!-- 查询过滤 -->
    <div class="filter-container">
      <el-select
        v-model="listQuery.contactUserId"
        placeholder="请选择访客会话"
        clearable
        class="filter-item"
        style="width: 130px"
        @change=" getHistoryMessage()"
      >
        <el-option
          v-for="item in conversationList"
          :key="item.key"
          :label="`访客${item.fromUserId}`"
          :value="item.fromUserId"
        />
      </el-select>
    </div>

    <!-- 表格 -->
    <el-table
      :data="messageList"
      border
      fit
      highlight-current-row
      style="width: 100%;"
    >
      <el-table-column label="消息id" prop="id" min-width="160px" align="center">
      <template slot-scope="{ row, $index }">
        <span>{{ $index + 1 }}</span>
      </template>
        </el-table-column>
      <el-table-column label="发送方id" prop="fromUserId" min-width="160px" align="center"/>
      <el-table-column label="接收方id" prop="toUserId" min-width="160px" align="center"/>
      <el-table-column label="消息内容" prop="content" min-width="160px" align="center">
        <template slot-scope="scope">
          <template v-if="scope.row.type === 1">{{ scope.row.content }}</template>
          <template v-else><img :src="scope.row.content" alt="表情图片"></template>
        </template>
      </el-table-column>
      <el-table-column label="发送日期" prop="createdAt" min-width="160px" align="center" :formatter="formatDate"/>
      <el-table-column label="操作" align="center" min-width="230px" class-name="small-padding fixed-width">
        <template slot-scope="{row}">
          <el-button type="primary" size="mini">
            编辑
          </el-button>
          <el-button size="mini" type="danger">
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页组件 -->
    <pagination
      v-show="total>0"
      :total="total"
      :page.sync="listQuery.page"
      :limit.sync="listQuery.pageSize"
      @pagination="getHistoryMessage()"
    />
  </div>
</template>

<script>
import waves from '@/directive/waves'
import Pagination from '@/components/Pagination'
import conversationApi from '@/api/conversation'
import messageApi from '@/api/message'

export default {
  components: { Pagination },
  directives: { waves },
  data() {
    return {
      messageList: [],
      conversationList: [],
      list: null, // 列表数据
      total: 0, // 列表总数
      listLoading: true, // 是否正在加载
      listQuery: {
        page: 1,
        pageSize: 20,
        // order: 'DESC',
        contactUserId: ''
      } // 列表查询条件
    }
  },
  created() {
    this.getConversationList()
  },
  methods: {
    formatDate(timestamp) {
      const date = new Date(timestamp.createdAt)
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      console.log(`${year}-${month}-${day}`)
      return `${year}-${month}-${day}`
    },
    // 获取会话列表
    getConversationList() {
      conversationApi.getConversationList(this.$store.getters.id).then((response) => {
        if (response.status === 200) {
          this.conversationList = response.data
        }
      })
    },
    // 获取消息历史记录
    getHistoryMessage() {
      const _this = this
      messageApi.getMessagePage(this.listQuery).then((response) => {
        _this.messageList = response.data.list
        _this.listQuery.pageSize = response.data.pageSize
        _this.listQuery.page = response.data.currentPage
        _this.total = response.data.totalCount
      })
    }

  }
}
</script>

<style scoped>

</style>
