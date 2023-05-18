<template>
  <div class="common-layout">
    <el-container>
      <el-header>
        <div>
          <!--          &lt;!&ndash; 数据为空 &ndash;&gt;-->
          <!--          <div v-if="messageList || messageList.length === 0" class="loading">-->
          <!--            <div style="margin-top: 300px; font-size: 16px;">-->
          <!--              <span>未查找到聊天记录</span>-->
          <!--            </div>-->
          <!--          </div>-->

          <!--          &lt;!&ndash; 刚进页面第一次加载 &ndash;&gt;-->
          <!--          <div v-if="messageList && messageList.length === 0" class="loading">-->
          <!--            <div style="margin-top: 300px; font-size: 16px;">-->
          <!--              <div>加载中...</div>-->
          <!--            </div>-->
          <!--          </div>-->
          <!-- 导航栏 -->
          <div v-if="messageList && messageList.length > 0" class="title">
            <span>客服{{ contact.nickname }}为您服务</span>
          </div>
          <div v-else class="title">
            <span>您好，请稍等，客服正在赶来的路上~</span>
          </div>
          <div class="opr-wrapper">
            <el-button type="primary" size="small" round @click="redirectLogin()">客服登录</el-button>
            <el-tooltip content="评分" placement="bottom" effect="light">
              <i class="fa fa-star-half-full" @click="showRateDialog()"/>
            </el-tooltip>
            <el-tooltip content="留言" placement="bottom" effect="light">
              <i class="fa fa-envelope-o" @click="showLeaveDialog()"/>
            </el-tooltip>
            <el-tooltip content="结束会话" placement="bottom" effect="light">
              <i class="fa fa-close" @click="closeChat()"/>
            </el-tooltip>
          </div>
        </div>
      </el-header>
      <el-main>
        <!-- 可上下滑滚动区域 -->
        <div
          id="scrollLoader-container"
          class="container-main message"
          :style="'maxHeight:' + (maxHeight - 50) + 'px'"
        >
          <div v-if="topLoading" class="loading">
            <div class="loader">加载历史记录...</div>
          </div>
          <div :style="'min-height:' + realMinHeight + 'px; overflow-x:hidden'">
            <!-- 初始进入页面提示 -->
            <div class="message">
              <!--              握手之后就隐藏-->
              <div v-if="this.user === null">
                <ul>
                  <li>
                    <img
                      class="avatar"
                      :src="robotAvatar"
                      alt="头像图片"
                    >
                    <div class="text">
                      您好，请问有什么事情需要咨询吗？
                      <el-button type="text" @click="chatCallback">转接人工客服</el-button>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
            <div v-if="messageList && messageList.length > 0" class="message">
              <ul>
                <li
                  v-for="(message,index) in messageList"
                  :key="message.id"
                  :class="isOneself(message) ? 'an-move-right' : 'an-move-left'"
                >
                  <!-- 时间 -->
                  <div v-if="message.type !==10000" class="time">
                    <span> {{ parseTime(message.createdAt, '{y}-{m}-{d} {h}:{i}:{s}') }}</span>
                    <span v-if="message.status ===1 && isOneself(message) ">未读</span>
                    <span v-if="message.status ===2 && isOneself(message)">已读</span>
                  </div>
                  <!-- 系统提示 -->
                  <div v-if="message.type === 10000" class="time system">
                    <span v-html="message.content"/>
                  </div>
                  <div v-else :class="'main' + (isOneself(message) ? ' self' : '')">
                    <!-- 头像 -->
                    <img
                      class="avatar"
                      :src="isOneself(message) ? user.avatar : contact.avatar"
                      alt="头像图片"
                    >
                    <!-- 文本 -->
                    <div
                      v-if="message.type == 1"
                      v-emotion="message.content"
                      class="text"
                      @contextmenu.prevent="isOneself(message) &&showContextMenu($event, message,index)"
                    />

                    <!-- 图片 -->
                    <div v-else-if="message.type == 2" class="text">
                      <img
                        :src="message.content"
                        class="image"
                        alt="聊天图片"
                        @contextmenu.prevent="isOneself(message) &&showContextMenu($event, message,index)"
                      >
                    </div>
                    <!--音频-->
                    <div v-else-if="message.type == 3" class="text">
                      <audio
                        :src="message.content"
                        class="audio-card"
                        controls
                        @contextmenu.prevent="isOneself(message) &&showContextMenu($event, message,index)"
                      />
                    </div>
                    <!--视频-->
                    <div v-else-if="message.type == 4" class="text">
                      <video
                        :src="message.content"
                        controls
                        class="video-card"
                        @contextmenu.prevent="isOneself(message) &&showContextMenu($event, message,index)"
                      />
                    </div>
                    <!-- 其他 -->
                    <div
                      v-else
                      class="text"
                      @contextmenu.prevent="isOneself(message) &&showContextMenu($event, message, index)"
                      v-text="'[暂未支持的消息类型:' + message.type + ']\n\r' + message.content"
                    />
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div class="input-container">
          <div class="input-tool-bar">
            <i class="el-icon-picture-outline-round" @click="showPicker = !showPicker"/>
            <div v-show="showPicker" class="picker">
              <Picker @select="onEmojiSelect"/>
            </div>
            <!--            <i class="el-icon-picture-outline"/>-->
            <i class="el-icon-folder-opened" @click="selectFile"/>
            <form method="post" enctype="multipart/form-data">
              <input ref="fileInput" type="file" style="display:none" @change="onFileChange">
            </form>
          </div>
          <div class="input-content">
            <div style="flex: 1">
              <el-input
                v-model="inputText"
                type="textarea"
                :placeholder="this.conversationStatus === 0 ? '会话已结束' : '请输入内容'"
                :rows="4"
                :disabled="this.conversationStatus === 0"
                @keyup.enter.native="sendMessage(1)"
              />
            </div>
          </div>
        </div>
      </el-main>

    </el-container>
    <el-dialog title="请选择客服" :visible.sync="transferDialogVisible" :close-on-press-escape="false">
      <im-transfer ref="im_transfer" @submit="transferDialog_submit"/>
    </el-dialog>
    <!-- 离线留言dialog -->
    <el-dialog :visible.sync="leaveDialogVisible" :close-on-press-escape="false">
      <im-leave ref="im_leave" @submit="submitLeave"/>
    </el-dialog>
    <!-- 满意度dialog -->
    <el-dialog :visible.sync="rateDialogVisible" :close-on-press-escape="false">
      <im-rate ref="im_rate" @submit="sumbitRate"/>
    </el-dialog>

    <!--    加一个对话框，你确定结束对话吗？-->
    <el-dialog title="提示" :visible.sync="conversationDialogVisible" :close-on-press-escape="false">
      <span>确定结束对话吗？</span>
      <span slot="footer" class="dialog-footer">
        <el-button @click="conversationDialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="endConversation">确 定</el-button>
      </span>
    </el-dialog>
    <ContextMenu
      v-if="contextMenuVisible"
      :top="contextMenuPosition.top"
      :left="contextMenuPosition.left"
      :items="contextMenuItems"
      @item-click="handleContextMenuItemClick"
    />
  </div>
</template>

<script>
import EventDispatcher from '@/utils/dispatch-event'
import { decode, encode } from '@/utils/codec'
import Command from '@/utils/command'
import { createPacket } from '@/utils/packet'
import conversationApi from '@/api/conversation'
import feedbackApi from '@/api/feedback'
import leaveInfoApi from '@/api/leaveInfo'
import messageApi from '@/api/message'
import { getId, removeId } from '@/utils/id'
import { parseTime } from '@/utils/date'
import imRate from './imRate.vue'
import imLeave from './imLeave.vue'
import imTransfer from './imTransfer.vue'
import ContextMenu from '@/components/common/ContextMenu'
import COS from 'cos-js-sdk-v5'
import { Picker } from 'emoji-mart-vue'
import { Decrypt, Encrypt } from '@/utils/AesEncryptUtil'
import Cookies from 'js-cookie'

export default {
  components: {
    imRate: imRate,
    imLeave: imLeave,
    imTransfer: imTransfer,
    ContextMenu,
    Picker
  },
  data() {
    return {
      reconnectInterval: null,
      isReConnedted: false,
      serverKey: '',
      secretKey: '',
      showPicker: false,
      url: '',
      file: null,
      cos: null,
      bucket: 'customer-1312794111', // 替换为您自己的存储桶名称
      region: 'ap-nanjing', // 替换为您自己的存储桶所在的地域
      conversationDialogVisible: false,
      teamId: '',
      recallMessageDto: {
        messageId: 0,
        userId: 0,
        contactUserId: 0
      },
      contextMenuVisible: false,
      contextMenuPosition: {
        top: 0,
        left: 0
      },
      robotAvatar: 'https://leftelft-picgo-1312794111.cos.ap-guangzhou.myqcloud.com/img/im_robot_avatar.png',
      contextMenuItems: ['撤回消息'],
      selectedMessageId: -1,
      selectedMessageIndex: -1,
      currentContextMessage: null,
      conversationId: 0, // 会话id
      conversationStatus: 1,
      messageList: [], // 聊天信息列表
      onlineServer: [], // 在线客服列表
      conversation: null, // 当前选中的会话
      listQuery: {
        userId: 0,
        contactUserId: 0,
        lessMessageId: 0
      }, // 列表查询条件

      topLoading: false,
      stopTopLoading: false, // 是否停止传播滚动到顶部事件
      isUpperLaoding: false,
      isRefreshedAll: false,

      minHeight: 700,
      maxHeight: 700,

      inputText: '', // 输入的文本内容

      socket: null, // socket
      eventDispatcher: null, // 事件派发器
      interval: null, // 间隔执行定时器
      logoutDialogVisible: false, // 结束会话显示
      transferDialogVisible: false, // 转接人工dialog
      rateDialogVisible: false, // 评价dialog
      leaveDialogVisible: false, // 留言dialog
      contact: null, // 联系人用户对象
      user: null // 当前用户对象
    }
  },
  computed: {
    realMinHeight() {
      return this.minHeight + 30
    }
  },
  // 不能操作DOM
  created() {
    this.getConversationList()
  },
  // 可以操作DOM
  mounted() {
    document.addEventListener('click', (event) => {
      const contextMenu = document.querySelector('.context-menu')
      if (contextMenu && !contextMenu.contains(event.target)) {
        this.hideContextMenu()
      }
    })
    // 事件派发器
    this.eventDispatcher = new EventDispatcher()
    // 监听滚动
    this.listenScroll()
    // 监听事件
    this.listenEvent()

    const _this = this
    // 开启websocket
    if (window.WebSocket) {
      // socket
      this.socket = new WebSocket('ws://localhost:9999/chat')
      this.socket.binaryType = 'arraybuffer'

      // 接收到消息
      this.socket.onmessage = function(event) {
        // 解码
        const packet = decode(event.data)
        // 不打印心跳包日志
        // if (packet && packet.command !== Command.HEART_BEAT_RESPONSE) {
        //   console.log(`接收到消息 ${JSON.stringify(packet)}`)
        // }

        // 派发接收数据事件
        _this.eventDispatcher.dispatchEvent(packet.command, packet)
      }

      // 连接建立
      this.socket.onopen = function(event) {
        console.log(`连接建立 ${JSON.stringify(event)}`)
        // 心跳检测
        _this.heartCheck()
        // socket连接成功后，登录netty
        // _this.loginNetty()
        _this.remenberMe()
      }

      // 连接关闭
      this.socket.onclose = function(event) {
        console.log(`连接关闭 ${JSON.stringify(event)}`)
        _this.isReConnedted = true
        _this.recover()
      }

      // 连接发生错误
      this.socket.onerror = function(event) {
        console.log(`连接错误 ${JSON.stringify(event)}`)
      }
    } else {
      console.log('当前浏览器不支持WebSocket')
    }

    // 刷新浏览器
    window.onbeforeunload = function() {
      if (!window.WebSocket) {
        console.log('当前浏览器不支持WebSocket')
        return
      }

      // 当websocket状态打开
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        this.socket.close()
      } else {
        console.log('连接没有开启')
      }
    }
  },
  beforeDestroy() {
    // 清除定时器
    if (this.interval) {
      console.log('清除定时器')
      window.clearInterval(this.interval)
      window.clearInterval(this.reconnectInterval)
    }
  },
  methods: {
    redirectLogin() {
      window.location.href = '/login'
    },
    remenberMe() {
      if (Cookies.get('socket_visitor_id') !== undefined) {
        // cookie存在，自动握手
        this.loginNetty()
      }
    },
    // 二次握手,交换密钥
    secondHandShakeHandler() {
      const data = {
        sessionId: this.conversationId,
        visitorId: this.user.id,
        serverId: this.contact.id
      }
      this.sendPacket(createPacket(data, Command.SECOND_HAND_SHAKE_REQUEST))
      // 打印发送第二次握手请求
      console.log(`发送第二次握手请求 ${JSON.stringify(data)}`)
    },
    onEmojiSelect(emoji) {
      // this.socket.close()
      // 在选择器中选择emoji后，会触发这个方法
      // emoji是一个包含emoji信息的对象，其中包含unicode或图片等属性
      // 将emoji转换为字符串，插入到聊天框中发送
      const emojiStr = emoji.native// 或者使用emoji-mart库提供的emoji转换函数
      // 加入到输入框
      this.inputText += emojiStr
      this.showPicker = false
    },
    // 打开文件选择对话框
    selectFile() {
      this.$refs.fileInput.click()
    },
    // 选择文件后触发
    onFileChange(event) {
      this.file = event.target.files[0]
      this.uploadFile()
    },
    // 上传文件到腾讯云 OSS
    async uploadFile() {
      if (!this.file) {
        alert('请选择要上传的文件')
        return
      }

      // 获取文件名和扩展名
      const fileName = this.file.name
      const extensionName = fileName.substring(fileName.lastIndexOf('.') + 1)

      // 设置文件名为当前时间戳和扩展名的组合
      const timestamp = new Date().getTime()
      const newFileName = `${timestamp}.${extensionName}`

      // 调用 COS SDK 上传文件
      this.cos.putObject({
        Bucket: this.bucket,
        Region: this.region,
        Key: newFileName,
        Body: this.file
      }, (error, data) => {
        if (error) {
          console.error(error)
          alert('文件上传失败，请重试')
          return
        }

        // 获取文件访问地址
        const self = this
        const url = this.cos.getObjectUrl({
          Bucket: this.bucket,
          Region: this.region,
          Key: newFileName,
          Sign: false
        }, function(err, data) {
          if (err) return console.log(err)
          /* url为对象访问 url */
          var url = data.Url
          /* 复制 downloadUrl 的值到浏览器打开会自动触发下载 */
          var downloadUrl =
            url +
            (url.indexOf('?') > -1 ? '&' : '?') +
            'response-content-disposition=attachment' // 补充强制下载的参数
          console.log(`新的文件访问地址: ${url}`, JSON.stringify(data, null, 2))
          self.url = url
        })
        alert('文件上传成功')
        let contentType
        if (['png', 'jpg', 'jpeg', 'gif', 'bmp'].indexOf(extensionName) >= 0) {
          contentType = '2'
        } else if (['mp4', 'avi', 'mov', 'wmv', 'mkv', 'flv'].indexOf(extensionName) >= 0) {
          contentType = '4'
        } else if (['mp3', 'wav', 'wma', 'ogg', 'aac', 'flac'].indexOf(extensionName) >= 0) {
          contentType = '3'
        } else {
          contentType = '5'
        }
        this.sendMessageOSS(contentType)
      })
    },
    createWebSocket() {
      this.socket = new WebSocket('ws://localhost:9999/chat')
      this.socket.binaryType = 'arraybuffer'
      this.socket.onopen = () => {
        console.log('WebSocket连接已建立')
        location.reload() // 刷新浏览器
      }
    },
    endConversation() {
      const _this = this
      this.conversationDialogVisible = false
      console.log(`关闭会话！`)
      // 调接口设置会话状态为已结束
      conversationApi.updateConversationEnd(this.conversationId).then(res => {
        if (res.status == 200) {
          // 删除cookie，下次进入的时候就会生成新的访客了
          removeId()
          // 设置会话状态为已结束
          _this.conversationStatus = 0
          console.log(`会话${_this.conversationId}已结束!`)
          // 关闭websocket
          this.socket.close()
        }
      })
      // 弹出评价窗口
      this.rateDialogVisible = true
    },
    closeChat() {
      this.conversationDialogVisible = true
    },
    transferDialog_show() {
      this.transferDialogVisible = true
      this.$nextTick(() => {
        this.$refs.im_transfer.init()
      })
    },
    /**
     * 转接客服dialog_提交 ,先创建会话，然后握手
     */
    transferDialog_submit(rs) {
      this.transferDialogVisible = false
      if (!rs.hasServer) {
        this.$message({
          message: '当前团队没有客服在线，请留言',
          type: 'warning'
        })
      }
      console.log('已选择客服id' + rs.serverChatId)
      console.log('已选择团队id' + rs.selectTeamId)
      // 如果选择了自动分配，则调接口分配客服
      if (rs.serverChatId === -1) {
        this.teamId = rs.selectTeamId
        // this.loginNetty()
        const data = {
          fromUserName: getId(),
          teamID: rs.selectTeamId
        }
        conversationApi.getConversationDistributionVO(data).then(res => {
          console.log(`分配客服成功,客服id:${res.data.server.id}`)
          // 分配成功，开始握手
          this.loginNetty()
        })
      } else {
        // 创建会话同时创建用户
        const data = {
          fromUserName: getId(),
          toUserId: rs.serverChatId,
          teamID: rs.selectTeamId
        }
        conversationApi.createConversation(data).then(res => {
          console.log(`创建会话成功`)
          // 创建成功，发送握手请求
          this.loginNetty()
        })
      }
    },
    // 每15秒尝试重新连接一次，直到连接成功就刷新浏览器
    recover() {
      const _this = this
      this.reconnectInterval = setInterval(function() {
        console.log('尝试重新连接...')
        _this.createWebSocket()
      }, 15000) // 每15秒尝试重新连接一次
    },
    chatCallback() {
      this.transferDialog_show()
    },
    hideContextMenu() {
      // 隐藏右键菜单
      this.contextMenuVisible = false
    },
    handleContextMenuItemClick(item) {
      const _this = this

      if (item === '撤回消息') {
        // 执行撤回消息的逻辑
        this.recallMessageDto.messageId = this.selectedMessageId
        this.recallMessageDto.userId = this.user.id
        this.recallMessageDto.contactUserId = this.contact.id
        messageApi.recallMessage(this.recallMessageDto).then((res) => {
          if (res.status === 200) {
            _this.messageList[_this.selectedMessageIndex].content = '你撤回了一条消息'
            _this.messageList[_this.selectedMessageIndex].type = 10000
            // 提示用户已经撤回了消息
            console.log(`撤回成功 ${JSON.stringify(res)}`)
          }
        }).catch(err => {
          console.log(`撤回失败 ${err}`)
        })
      }
      this.hideContextMenu()
    },
    showContextMenu($event, message, index) {
      const now = new Date().getTime()
      console.log(`createAt时间: ${message.createdAt}`)
      if (now - message.createdAt <= 120000) {
        event.preventDefault()
        this.selectedMessageIndex = index
        this.selectedMessageId = message.id
        this.currentContextMessage = message
        console.log(`当前选中的消息id: ${message.id} index: ${index}`)
        this.contextMenuPosition = {
          top: event.pageY,
          left: event.pageX
        }
        this.contextMenuVisible = true
      }
    },
    submitLeave(data) {
      console.log(`提交留言${JSON.stringify(data)}`)
      data.conversationId = this.conversationId ? this.conversationId : 0
      data.serverId = this.contact ? this.contact.id : 0
      data.visitorId = this.user ? this.user.id : 0
      leaveInfoApi.addLeaveInfo(data).then(response => {
        console.log(`提交留言成功${JSON.stringify(response)}`)
        this.leaveDialogVisible = false
      })
    },
    sumbitRate(data) {
      console.log(`提交反馈数据${JSON.stringify(data)}`)
      // 向这个data添加属性
      data.conversationId = this.conversationId
      data.serverId = this.contact.id
      data.visitorId = this.user.id
      feedbackApi.addFeedBcak(data).then(response => {
        console.log(`提交反馈数据成功${JSON.stringify(response)}`)
        this.rateDialogVisible = false
      })
      // 刷新浏览器
      window.location.reload()
    },
    parseTime(time, cFormat) {
      return parseTime(time, cFormat)
    },
    /**
     * 显示评分dialog
     */
    showRateDialog() {
      this.rateDialogVisible = true
    },
    /**
     * 显示留言dialog
     */
    showLeaveDialog() {
      this.leaveDialogVisible = true
      this.$nextTick(() => {
        this.$refs.im_leave.init()
      })
    },
    // 滚动到聊天框底部
    scrollToBottom() {
      const _this = this
      setTimeout(() => {
        const scrollContainer = _this.$el.querySelector('#scrollLoader-container')
        // console.log(`滚动到最底部 scrollTop=${scrollContainer.scrollTop}, scrollHeight=${scrollContainer.scrollHeight}, clientHeight=${scrollContainer.clientHeight}`)
        scrollContainer.scrollTop = scrollContainer.scrollHeight - scrollContainer.clientHeight
        // console.log(`滚动到最底部 scrollTop=${scrollContainer.scrollTop}, scrollHeight=${scrollContainer.scrollHeight}, clientHeight=${scrollContainer.clientHeight}`)
      }, 50)
    },
    // 获取会话列表
    getConversationList() {
      conversationApi.getListOnlineServer().then((response) => {
        if (response.status === 200) {
          this.onlineServer = response.data
        }
      })
    },
    // 获取聊天信息列表
    getMessageList(done) {
      const _this = this
      messageApi.getMessageList(this.listQuery).then((response) => {
        if (response.status === 200) {
          if (response.data.length === 0) {
            _this.isRefreshedAll = true
            if (done) {
              done(true)
            }
          } else {
            _this.messageList = response.data.reverse().concat(_this.messageList) // 倒序合并
            if (done) {
              done()
            } else {
              _this.scrollToBottom()
            }
          }
          // console.log(response.data)
          _this.isUpperLaoding = false
        }
      })
    },
    // 发送数据包
    sendPacket(packet) {
      if (!window.WebSocket) {
        console.log('当前浏览器不支持WebSocket')
        return
      }

      // 当websocket状态打开
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        // 不打印心跳包日志
        if (packet && packet.command !== Command.HEART_BEAT_REQUEST) {
          console.log(`发送数据包 ${JSON.stringify(packet)}`)
        }
        this.socket.send(encode(packet))
      } else {
        console.log('连接没有开启，发送失败')
      }
    },
    // 事件监听器
    listenEvent() {
      const _this = this

      // 第一次握手回调
      this.eventDispatcher.addListener(Command.LOGIN_RESPONSE, packet => {
        if (packet.success) {
          // 会话id
          _this.conversationId = packet.conversationId
          // 当前用户信息
          _this.user = packet.user
          // 联系人
          _this.contact = packet.contact
          _this.messageList = []
          _this.listQuery.userId = _this.user.id
          _this.listQuery.contactUserId = _this.contact.id
          _this.listQuery.lessMessageId = 0
          _this.getMessageList()
          // 获取密钥
          this.secretKey = packet.secretKey
          console.log(`第一次握手成功\n握手响应内容：${JSON.stringify(packet)}，\n获取身份密钥 ${this.secretKey}`)
          // 允许发送文件，初始化腾讯云 OSS 对象存储 SDK todo 后期改成云端下发
          this.cos = new COS({
            SecretId: 'AKID0rVwMcfU5bu1uZ0DRtFOL7jAPRIyRoDV', // 替换为您自己的 SecretId
            SecretKey: 'EG6mQtBJEwbAZo02qbDhGl6GDxeBVcev' // 替换为您自己的 SecretKey
          })
          // 进行第二次握手
          _this.secondHandShakeHandler()
        } else {
          console.log(`第一次握手失败\n握手响应内容：${JSON.stringify(packet)}`)
          // 删除cookie
          removeId()
          // 弹出提示信息，请重新发起会话
          _this.$message({
            message: '当前会话已结束，请重新发起会话',
            type: 'warning'
          })
        }
      })

      // 第二次握手回调
      this.eventDispatcher.addListener(Command.SECOND_HAND_SHAKE_RESPONSE, packet => {
        this.serverKey = packet.serverKey
        console.log(`第二次握手成功\n二次握手响应内容：${JSON.stringify(packet)}`)
        console.log(`第二次握手成功\n绑定密钥：客服${_this.serverKey},访客${_this.secretKey}`)
      })
      // 接收消息回调
      this.eventDispatcher.addListener(Command.MESSAGE_RESPONSE, packet => {
        console.log(`收到信息解码前 ${JSON.stringify(packet)}`)
        // if (!this.isOneself(packet)) {
        // console.log(`使用密钥 ${_this.serverKey}解密`)
        // 如果对方发送的，则用对方的密钥解密
        //   packet.content = Decrypt(packet.content, _this.serverKey)
        // } else {
        //   console.log(`使用密钥 ${_this.secretKey}解密`)
        // 如果是自己发送的，则用自己的密钥解密
        packet.content = Decrypt(packet.content, _this.secretKey)
        // }
        // 收到消息时添加到消息列表
        _this.messageList.push(packet)
        _this.scrollToBottom()
        console.log(`收到信息解码后 ${JSON.stringify(packet)}`)
      })
      // 已读通知回调
      this.eventDispatcher.addListener(Command.READ_RESPONSE, packet => {
        // 更新已读通知,将未读消息状态改为已读
        packet.readedList.forEach(item => {
          _this.messageList.forEach(message => {
            if (message.id === item.id) {
              message.status = 2
            }
          })
        })
        _this.scrollToBottom()
        console.log(`对方上线已读 ${JSON.stringify(packet)}`)
      })
      // 消息撤回通知回调
      this.eventDispatcher.addListener(Command.RECALL_RESPONSE, packet => {
        // 更新对方撤回通知
        _this.messageList.forEach(message => {
          if (message.id === packet.messageId) {
            message.type = 10000
            message.content = '对方撤回了一条消息'
          }
        })
        _this.scrollToBottom()
        console.log(`收到撤回通知 ${JSON.stringify(packet)}`)
      })
      // 客服结束会话通知回调
      this.eventDispatcher.addListener(Command.END_CONVERSATION_RESPONSE, packet => {
        if (packet.success) {
          console.log(`客服结束会话通知 ${JSON.stringify(packet)}`)
          // 关闭websocket
          this.socket.close()
          _this.$message({
            message: '客服已结束会话',
            type: 'warning'
          })
          // 弹出评价提示框
          this.rateDialogVisible = true
          // 删除cookie，下次进入的时候就会生成新的访客了
          removeId()
          // 设置会话状态为已结束，禁止输入内容
          _this.conversationStatus = 0
          console.log(`会话${_this.conversationId}已结束!`)
        }
      })
    },
    // 心跳检测
    heartCheck() {
      const _this = this
      this.interval = window.setInterval(() => {
        // console.log(`发送心跳,${new Date().toTimeString()}`)
        _this.sendPacket(createPacket({}, Command.HEART_BEAT_REQUEST))
      }, 5000)
    },
    // 第一次握手
    loginNetty() {
      const data = {
        username: getId(),
        teamId: this.teamId
      }
      // 打印发送第一次握手
      this.sendPacket(createPacket(data, Command.LOGIN_REQUEST))
      console.log(`发送第一次握手:${JSON.stringify(data)}`)
    },
    sendMessageOSS(type) {
      console.log(`发送信息:${this.url}`)
      const data = {
        conversationId: this.conversationId,
        content: Encrypt(this.url, this.secretKey),
        type: type,
        toUserId: this.contact.id
      }
      this.sendPacket(createPacket(data, Command.MESSAGE_REQUEST))
      // 清空文本框
      this.inputText = ''
    },
    // 发送信息
    sendMessage(type) {
      console.log(`发送信息:${this.inputText}，采用密钥${this.secretKey}加密`)
      // 用自己的密钥加密消息内容数据
      const data = {
        conversationId: this.conversationId,
        content: Encrypt(this.inputText, this.secretKey),
        type: type,
        toUserId: this.contact.id
      }
      console.log(`发送信息加密后:${JSON.stringify(data.content)}`)
      this.sendPacket(createPacket(data, Command.MESSAGE_REQUEST))
      // 清空文本框
      this.inputText = ''
    },
    // 是否是自己发送的信息
    isOneself(message) {
      return message.fromUserId === this.user.id
    },
    // 根据会话获取联系人
    getContact(conversation) {
      // 当前用户是会话发起方，则联系人就是会话的接收方。反之同理
      if (this.user.id === conversation.fromUserId) {
        return conversation.toUser
      } else {
        return conversation.fromUser
      }
    },
    // 监听聊天窗口滚动，并触发上下拉刷新
    listenScroll() {
      const _this = this
      const topDone = stopTopLoading => {
        _this.topLoading = false
        if (stopTopLoading) {
          _this.stopTopLoading = true
        }
      }

      setTimeout(function() {
        const scrollContainer = _this.$el.querySelector('#scrollLoader-container')

        scrollContainer.onscroll = function() {
          // console.log(`滚动中 scrollTop=${scrollContainer.scrollTop}, scrollHeight=${scrollContainer.scrollHeight}, clientHeight=${scrollContainer.clientHeight}`)
          if (scrollContainer.scrollTop <= 0 && !_this.stopTopLoading) {
            if (_this.topLoading) {
              return
            }

            _this.topLoading = true

            if (_this.isUpperLaoding) {
              return
            }

            if (_this.isRefreshedAll) {
              topDone(true)
              _this.isUpperLaoding = false
              return
            }

            _this.listQuery.lessMessageId = _this.messageList[0].id
            // 监听滚动，刷新聊天记录
            _this.getMessageList(topDone)
          }
        }
      }, 50)
    }
  }
}
</script>

<style scoped>
/*.opr-wrapper .tooltip-right {*/
/*  left: 100%;*/
/*  transform: translateX(100px);*/
/*}*/

.picker {
  position: absolute;
  top: -420px;
  /*transform: translateX(-240px);*/
  /*transform: translateY(-60%);*/
}

.audio-container {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
}

.audio-card {
  width: 250px;
  height: 50px;

}

.video-container {
  max-width: 100%;
  max-height: 500px;
  overflow: hidden;
}

.video-card {
  width: 100%;

}

.input-container {
  height: 150px;
  display: flex;
  display: -webkit-flex;
  flex-direction: column;
  border-top: 1px solid #EBEEF5;
}

.input-tool-bar {
  position: relative;
  height: 50px;
  display: flex;
  display: -webkit-flex;
  background-color: #ffffff;
  align-items: center;
}

.input-content {
  flex: 1;
  display: flex;
  display: -webkit-flex;
}

.input-content .input-send {
  width: 80px;
  display: flex;
  display: -webkit-flex;
  flex-direction: column;
  align-self: flex-end;
}

.input-send .input-send-btn {
  margin: 0 15px 15px 0;
}

.input-tool-bar i {
  width: 35px;
  text-align: center;
  font-size: 1.5em;
  color: #AAB2BC;
}

.opr-wrapper {
  position: absolute;
  right: 4%;
  top: 3%;
  transform: translateY(-60%);
  font-size: 20px;
  cursor: pointer;
  color: #ffffff;
  /*right: 20px;*/
  /*font-size: 16px;*/
  /*cursor: pointer;*/
}

.fa {
  margin-left: 10px;
}

.tooltip-right {
  left: 100%;
  transform: translateX(100px);
}

/* 消息列表 */
.chat-container {
  background-color: #efefef;
  z-index: 100;
  overflow: hidden;
  min-width: 300px;
  margin: 0 auto;
  padding: 0;
  position: relative;
}

.title {
  position: relative;
  background: #1060b4;
  text-align: center;
  color: #fff;
  width: 100%;
  height: 50px;
  line-height: 50px;
  font-size: 14px;
}

.loading {
  text-align: center;
  color: #b0b0b0;
  line-height: 100px;
}

.message {
  padding: 10px 15px;
  background-color: #f5f5f5;
}

.message li {
  margin-bottom: 15px;
  left: 0;
  position: relative;
  display: block;
}

.message .time {
  margin: 10px 0;
  text-align: center;
}

.message .text {
  display: inline-block;
  position: relative;
  max-width: calc(100% - 75px);
  min-height: 35px;
  line-height: 2.1;
  font-size: 15px;
  padding: 6px 10px;
  text-align: left;
  word-break: break-all;
  background-color: #fff;
  color: #000;
  border-radius: 4px;
  box-shadow: 0px 1px 7px -5px #000;
}

.message .avatar {
  float: left;
  margin: 0 10px 0 0;
  border-radius: 3px;
  background: #fff;
  width: 45px;
  height: 45px;
}

.message .time > span {
  display: inline-block;
  padding: 0 5px;
  font-size: 12px;
  color: #fff;
  border-radius: 2px;
  background-color: #dadada;
}

.message .system > span {
  padding: 4px 9px;
  text-align: left;
}

.message .text:before {
  content: " ";
  position: absolute;
  top: 9px;
  right: 100%;
  border: 6px solid transparent;
  border-right-color: #fff;
}

.message .main {
  text-align: left;
}

.message .self {
  text-align: right;
}

.message .self .avatar {
  float: right;
  margin: 0 0 0 10px;
}

.message .self .text {
  background-color: #9eea6a;
}

.message .self .text:before {
  right: inherit;
  left: 100%;
  border-right-color: transparent;
  border-left-color: #9eea6a;
}

.message .image {
  max-width: 200px;
}

img.static-emotion-gif,
img.static-emotion {
  vertical-align: middle !important;
}

.an-move-left {
  left: 0;
  animation: moveLeft 0.7s ease;
  -webkit-animation: moveLeft 0.7s ease;
}

.an-move-right {
  left: 0;
  animation: moveRight 0.7s ease;
  -webkit-animation: moveRight 0.7s ease;
}

@keyframes moveRight {
  0% {
    left: -20px;
    opacity: 0;
  }
  100% {
    left: 0;
    opacity: 1;
  }
}

@-webkit-keyframes moveRight {
  0% {
    left: -20px;
    opacity: 0;
  }
  100% {
    left: 0;
    opacity: 1;
  }
}

@keyframes moveLeft {
  0% {
    left: 20px;
    opacity: 0;
  }
  100% {
    left: 0;
    opacity: 1;
  }
}

@-webkit-keyframes moveLeft {
  0% {
    left: 20px;
    opacity: 0;
  }
  100% {
    left: 0;
    opacity: 1;
  }
}

@media (max-width: 367px) {
  .fzDInfo {
    width: 82%;
  }
}

/* 上下拉刷新 */
.container-main {
  margin: 0 auto;
  overflow: auto;
  overflow-x: hidden;
  padding: 0;
}

.loading {
  width: 100%;
  height: 40px;
  position: relative;
  overflow: hidden;
  text-align: center;
  margin: 5px 0;
  color: #999;
  font-size: 13px;
}

.loader {
  font-size: 10px;
  margin: 8px auto;
  text-indent: -9999em;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #999;
  background: -moz-linear-gradient(left, #999 10%, rgba(255, 255, 255, 0) 42%);
  background: -webkit-linear-gradient(left, #999 10%, rgba(255, 255, 255, 0) 42%);
  background: -o-linear-gradient(left, #999 10%, rgba(255, 255, 255, 0) 42%);
  background: -ms-linear-gradient(left, #999 10%, rgba(255, 255, 255, 0) 42%);
  background: linear-gradient(to right, #999 10%, rgba(255, 255, 255, 0) 42%);
  position: relative;
  -webkit-animation: load3 1s infinite linear;
  animation: load3 1s infinite linear;
}

.loader:before {
  width: 50%;
  height: 50%;
  background: #999;
  border-radius: 100% 0 0 0;
  position: absolute;
  top: 0;
  left: 0;
  content: "";
}

.loader:after {
  background: #f5f5f5;
  width: 72%;
  height: 75%;
  border-radius: 68%;
  content: "";
  margin: auto;
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
}

@-webkit-keyframes load3 {
  0% {
    -webkit-transform: rotate(0deg);
    transform: rotate(0deg);
  }
  100% {
    -webkit-transform: rotate(360deg);
    transform: rotate(360deg);
  }
}

@keyframes load3 {
  0% {
    -webkit-transform: rotate(0deg);
    transform: rotate(0deg);
  }
  100% {
    -webkit-transform: rotate(360deg);
    transform: rotate(360deg);
  }
}
</style>
