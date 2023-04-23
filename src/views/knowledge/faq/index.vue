<template>
  <div class="app-container">
    <!-- 查询过滤 -->
    <div class="filter-container">
      <el-input v-model="listQuery.title" placeholder="请输入标题搜索" style="width: 200px;" class="filter-item"
                @keyup.enter.native="handleFilter"
      />
      <el-button v-waves class="filter-item" style="margin-left: 5px;" type="success" icon="el-icon-search"
                 @click="handleFilter"
      >
        搜索
      </el-button>
      <!--      <el-button class="filter-item" style="margin-left: 10px;" type="primary" icon="el-icon-plus" @click="handleCreate">-->
      <!--        新增-->
      <!--      </el-button>-->
    </div>

    <!-- 表格 -->
    <el-table
      v-loading="listLoading"
      :data="list"
      border
      fit
      highlight-current-row
      style="width: 100%;"
      @sort-change="sortChange"
    >
      <!--      <el-table-column label="序号" prop="id" sortable="custom" align="center" min-width="80">-->
      <!--        <template slot-scope="{row}">-->
      <!--          <span>{{ row.id }}</span>-->
      <!--        </template>-->
      <!--      </el-table-column>-->
      <el-table-column label="序号" sortable="custom" align="center" min-width="80">
        <template slot-scope="{ row, $index }">
          <span>{{ $index + 1 }}</span>
        </template>
      </el-table-column>
      <!--      <el-table-column label="评价分数"  prop="score" min-width="160px" align="center"/>-->
      <el-table-column label="评价分数" min-width="160px" align="center">
        <template slot-scope="scope">
          <el-rate v-model="scope.row.score" :max="5" disabled void-icon="el-icon-star-off"
                   :colors="['#99A9BF', '#F7BA2A', '#FF9900']"
          ></el-rate>
        </template>
      </el-table-column>
      <el-table-column label="评价内容" prop="content" min-width="160px" align="center"/>
      <el-table-column label="访客用户名" prop="visitor.username" min-width="160px" align="center"/>
      <el-table-column label="服务客服" prop="server.nickname" min-width="160px" align="center"/>
      <el-table-column label="评价日期" prop="createAt" min-width="160px" align="center">
        <template slot-scope="{row}">
          <span>{{ parseTime(row.createAt, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" min-width="160px" class-name="small-padding fixed-width">
        <template slot-scope="{row}">
          <el-button type="primary" size="mini" @click="handleUpdate(row)">
            编辑
          </el-button>
          <el-button size="mini" type="danger" @click="handleDelete(row)">
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页组件 -->
    <pagination v-show="total>0" :total="total" :page.sync="listQuery.page" :limit.sync="listQuery.pageSize"
                @pagination="getList"
    />

    <!-- 编辑框 -->
    <el-dialog :title="dialogTitleMap[dialogStatus]" :visible.sync="dialogFormVisible" width="880px">
      <el-form :model="editForm" label-width="80px">
        <el-form-item label="评价分数">
          <el-rate v-model="editForm.score" :max="5" disabled void-icon="el-icon-star-off"
                   :colors="['#99A9BF', '#F7BA2A', '#FF9900']"
          ></el-rate>
        </el-form-item>
        <el-form-item label="评价内容">
          <el-input v-model="editForm.content"></el-input>
        </el-form-item>
        <el-form-item label="访客名称">
          <el-input v-model="editForm.visitor.username" :disabled="true"></el-input>
        </el-form-item>
        <el-form-item label="服务客服">
          <el-input v-model="editForm.server.nickname" :disabled="true"></el-input>
        </el-form-item>
        <el-form-item label="评价日期">
          <el-date-picker v-model="editForm.createAt" type="date" placeholder="选择日期"></el-date-picker>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="dialogFormVisible = false">
          取消
        </el-button>
        <el-button type="primary" @click="dialogStatus === 'create' ? createData() : updateData()">
          确定
        </el-button>
      </div>
    </el-dialog>

  </div>
</template>

<script>
import { MessageBox } from 'element-ui'
import waves from '@/directive/waves'
import Pagination from '@/components/Pagination'
import faqApi from '@/api/faq'
import { getToken } from '@/utils/auth'
import { parseTime } from '@/utils/date'
import feedbackApi from '@/api/feedback'

export default {
  components: { Pagination },
  directives: { waves },
  data() {
    return {
      editForm: { // 编辑对话框中的表单数据
        id: '',
        score: '',
        content: '',
        visitor: { username: '' },
        server: { nickname: '' },
        createAt: ''
      },
      list: null, // 列表数据
      total: 0, // 列表总数
      listLoading: true, // 是否正在加载
      listQuery: {
        page: 1,
        pageSize: 10,
        order: 'DESC',
        orderByField: 'id'
      }, // 列表查询条件
      dialogFormVisible: false, // 是否显示弹窗
      dialogStatus: '', // 弹窗的状态 create/update
      dialogTitleMap: {
        update: '修改内容',
        create: '新增内容'
      }, // 弹窗标题
      rules: {
        title: [
          { required: true, message: '请输入标题', trigger: 'change' }
        ]
      }, // 用户编辑表单的验证规则
      editor: null,
      headers: {
        'Content-Type': 'application/json; charset=UTF-8',
        'Authorization': 'Bearer ' + getToken()
      },
      imagesUploadApi: '' // 上传图片到服务器
    }
  },
  created() {
    this.getList()
  },
  methods: {
    parseTime(time, cFormat) {
      return parseTime(time, cFormat)
    },
    getList() {
      this.listLoading = true
      feedbackApi.getFeedBackList(this.listQuery).then((response) => {
        this.listLoading = false
        this.list = response.data.list
        this.total = response.data.totalCount
      })
    },
    restForm() {
      const userInfo = this.$store.getters.userInfo
      this.faqInfo = Object.assign({}, { title: '', content: '', userId: userInfo.id, teamId: userInfo.team.id })

      this.$nextTick(() => {
        this.$refs.dataForm.clearValidate()
      })
    },
    sortChange(data) {
      const { prop, order } = data
      this.listQuery.orderByField = prop
      if (order === 'ascending') {
        this.listQuery.order = 'ASC'
      } else {
        this.listQuery.order = 'DESC'
      }
      this.handleFilter()
    },
    handleFilter() {
      this.listQuery.page = 1
      this.getList()
    },
    handleUpdate(row) {
      this.dialogStatus = 'update'
      this.dialogFormVisible = true
      this.editForm = {
        id: row.id,
        score: row.score,
        content: row.content,
        visitor: row.visitor,
        server: row.server,
        createAt: row.createAt
      }
    },
    handleDelete(row) {
      MessageBox.confirm(`确定删除吗？删除后无法恢复，请谨慎操作！`, '温馨提示', {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.deleteData(row.id)
      })
    },
    deleteData(faqId) {
      feedbackApi.deleteFeedBack(faqId).then((response) => {
        if (response.status === 200) {
          // 隐藏弹窗并弹窗通知提示
          this.dialogFormVisible = false
          this.$notify({
            title: '成功',
            message: '删除常见问题成功',
            type: 'success',
            duration: 2000
          })
          // 重新加载数据
          this.getList()
        }
      })
    },
    createData() {
      this.$refs.dataForm.validate((valid) => {
        if (valid) {
          faqApi.addFaq(this.faqInfo).then((response) => {
            if (response.status === 200) {
              // 隐藏弹窗并弹窗通知提示
              this.dialogFormVisible = false
              this.$notify({
                title: '成功',
                message: '创建常见问题成功',
                type: 'success',
                duration: 2000
              })
              // 重新加载数据
              this.getList()
            }
          })
        } else {
          console.log('error submit!!')
          return false
        }
      })
    },
    updateData() {
      const data = {
        id: this.editForm.id,
        content: this.editForm.content,
        createAt: this.editForm.createAt
      }
      feedbackApi.updateFeedBack(data).then((response) => {
        if (response.status === 200) {
          // 隐藏弹窗并弹窗通知提示
          this.dialogFormVisible = false
          this.$notify({
            title: '成功',
            message: '更新常见问题信息成功',
            type: 'success',
            duration: 2000
          })
          // 重新加载数据
          this.getList()
        }
      }, (error) => {
        console.log(error)
      })
    }
  }
}

</script>

<style rel="stylesheet/scss" lang="scss" scoped>
> > > .el-input-number .el-input__inner {
  text-align: left;
}
</style>
