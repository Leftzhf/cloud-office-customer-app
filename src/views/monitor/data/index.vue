<template>
  <div class="app-container">
    <!-- 查询过滤 -->
    <div class="filter-container">
      <el-select
        v-model="listQuery.contactUserId"
        placeholder="请选择访客会话"
        clearable
        class="filter-item"
        style="width: 140px"
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
      <el-table-column label="发送方" prop="fromUserId" min-width="160px" align="center" >
        <template slot-scope="{ row }">
          <span v-if="isOneself(row)">客服</span>
          <span v-else>访客</span>
        </template>
      </el-table-column>
      <el-table-column label="接收方" prop="toUserId" min-width="160px" align="center">
        <template slot-scope="{ row }">
          <span v-if="!isOneself(row)">客服</span>
          <span v-else>访客</span>
        </template>
      </el-table-column>
      <el-table-column label="消息内容" prop="content" min-width="160px" align="center">
        <template slot-scope="scope">
          <template v-if="scope.row.type === 1">{{ scope.row.content }}</template>
          <template v-else><img :src="scope.row.content" alt="表情图片"></template>
        </template>
      </el-table-column>
      <el-table-column label="发送日期" prop="createdAt" min-width="160px" align="center" :formatter="formatDate"/>
      <el-table-column label="操作" align="center" min-width="230px" class-name="small-padding fixed-width">
        <template slot-scope="{row}">
          <el-button size="mini" type="danger" @click="handleDelete(row)">
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
import { MessageBox } from 'element-ui'
import MessageApi from '@/api/message'

export default {
  components: { Pagination },
  directives: { waves },
  data() {
    return {
      user: this.$store.getters.userInfo,
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
    deleteData(id) {
      messageApi.deleteMessageById(id).then((response) => {
        if (response.status === 200) {
          this.$notify({
            title: '成功',
            message: '删除成功',
            type: 'success',
            duration: 2000
          })
          // 重新加载数据
          this.getHistoryMessage()
        }
      })
    },
    handleDelete(row){
      MessageBox.confirm(`确定删除吗？删除后无法恢复，请谨慎操作！`, '温馨提示', {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.deleteData(row.id)
      })
    },
    // 是否是自己发送的信息
    isOneself(row) {
      // console.log(row)
      // console.log(this.user)
      return row.fromUserId === this.user.id
    },
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
