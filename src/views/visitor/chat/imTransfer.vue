<!-- 转接 -->
<template>
  <div class="imTransfer-wrapper">
    <main class="main">
      <el-select v-model="value" placeholder="请选择产品" @change="getServer">
        <el-option
          v-for="item in options"
          :key="item.id"
          :label="item.name"
          :value="item.id"
        />
      </el-select>
      <el-button v-if="teamId !==''" type="primary" @click="submitAuto">自动分配</el-button>
      <div class="divider"></div>
      <el-radio-group v-model="selectedServerChatId" class="item-group">
        <div class="item" v-for="(item, index) in kfList" :key="index">
          <el-radio-button :label="item.id">{{ item.nickname }}</el-radio-button>
        </div>
      </el-radio-group>
    </main>
    <footer class="footer">
      <el-button type="primary" :disabled="selectedServerChatId == ''" @click="submit">开始咨询</el-button>
    </footer>
  </div>
</template>

<script>
import conversationApi from '@/api/conversation'
import teamApi from '@/api/team'
export default {
  data() {
    return {
      hasServer: true,
      teamId: '',
      value: '',
      options:[],
      kfList: [], // 转人工队列集合
      selectedServerChatId: '', // 选中的serverChatId
      selectTeamId: ''
    }
  },
  computed: {},
  watch: {},
  methods: {
    init(){
      teamApi.getTeamInfoList().then(res => {
        this.options = res.data
      })
    },
    getServer(teamId) {
      this.teamId = teamId
      console.log(`选择了团队id: ${teamId}`)
      // 根据选择的团队获取客服
      conversationApi.getListOnlineServerByTeamId(teamId).then(res => {
        this.kfList = res.data
        // 如果this.kfList为空
        if (this.kfList.length === 0) {
          this.hasServer = false
        }
      })
      this.selectedServerChatId = ''
    },

    /**
     * 队列dialog_提交
     */
    submit: function() {
      // 回传客服userId和teamId
      this.$emit('submit', {
        serverChatId: this.selectedServerChatId,
        selectTeamId: this.teamId,
        hasServer: this.hasServer
      })
    },
    submitAuto: function() {
      // 回传客服userId和teamId
      this.selectedServerChatId = -1
    }
  },
  mounted() {
  }
}
</script>

<style lang="less">
.divider {
  border-bottom: 1px solid #ccc;
  margin: 10px 0;
}
.imTransfer-wrapper {
  .main {
    height: 200px;
    border-bottom: 1px solid #ebeff3;

    .item {
      float: left;
      text-align: center;
      padding: 30px 21px 0px;

      .el-radio-button__inner {
        display: inline-block;
        width: 121px;
        font-size: 14px;
        color: #3e3e3e;
        white-space: nowrap;
        text-overflow: ellipsis;
        border-radius: 5px;
        overflow: hidden;
      }

      .el-radio-button.is-active {
        .el-radio-button__inner {
          color: #00a8d7;
          background-color: #fff;
        }
      }
    }
  }

  .footer {
    text-align: center;
    padding: 14px 0px;
  }
}
</style>
