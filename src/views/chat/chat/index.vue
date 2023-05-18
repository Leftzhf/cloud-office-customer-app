<template>
  <div class="app-container" :style="'height:' + (clientHeight - 50) + 'px;'">
    <!-- 左边栏 -->
    <div class="left-container">
      <el-table
        :data="filteredConversationList"
        style="width: 100%"
        height="957"
        highlight-current-row
        @cell-click="handleConversation"
      >
        <el-table-column label="会话列表">
          <template slot-scope="{row}">
            <span>访客{{ getContact(row).username }}</span>
          </template>
        </el-table-column>
      </el-table>


    </div>

    <!-- 中间栏 -->
    <div class="center-container">
      <div v-if="conversation" class="chat-container">
        <!-- 导航栏 -->
        <div class="chat-nav">
          <span>访客 {{ contact.username }} </span>
        </div>

        <!-- 可上下滑滚动区域 -->
        <div id="scrollLoader-container" class="scroll-container">
          <div v-if="topLoading" class="loading">
            <div class="loader">加载历史记录...</div>
          </div>

          <!-- 消息内容列表容器 -->
          <div class="message-container">
            <!-- 消息内容列表 -->
            <div v-if="messageList && messageList.length > 0" class="message">
              <ul>
                <li
                  v-for="(message,index) in messageList"
                  :key="message.id"
                  :class="isOneself(message) ? 'an-move-right' : 'an-move-left'"
                >
                  <!-- 时间 -->
                  <div class="time" v-if="message.type !==10000">
                    <span> {{ parseTime(message.createdAt, '{y}-{m}-{d} {h}:{i}:{s}') }}</span>
                    <span v-if="message.status === 1 && isOneself(message)">未读</span>
                    <span v-if="message.status === 2 && isOneself(message)">已读</span>
                  </div>
                  <!-- 系统提示 -->
                  <div v-if="message.type == 10000 " class="time system">
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
                    <div v-if="message.type == 1" v-emotion="message.content" class="text"
                         @contextmenu.prevent="isOneself(message) &&showContextMenu($event, message,index)"
                    />

                    <!-- 图片 -->
                    <div v-else-if="message.type == 2" class="text">
                      <img :src="message.content" class="image" alt="聊天图片"
                           @contextmenu.prevent="isOneself(message) &&showContextMenu($event, message,index)"
                      >
                    </div>
                    <!--音频-->
                    <div v-else-if="message.type == 3" class="audio-container">
                      <audio :src="message.content" controls
                             @contextmenu.prevent="isOneself(message) &&showContextMenu($event, message,index)"
                      ></audio>
                    </div>
                    <!--视频-->
                    <div v-else-if="message.type === 4" class="video-container">
                      <video :src="message.content" controls
                             @contextmenu.prevent="isOneself(message) &&showContextMenu($event, message,index)"
                      ></video>
                    </div>
                    <!-- 其他 -->
                    <div
                      v-else
                      class="text"
                      v-text="'[暂未支持的消息类型:' + message.type + ']\n\r' + message.content"
                      @contextmenu.prevent="isOneself(message) &&showContextMenu($event, message ,index)"
                    />
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <!-- 底部输入框区域 -->
        <div class="input-container">

          <div class="input-tool-bar">
            <i class="el-icon-picture-outline-round" @click="showPicker = !showPicker"/>
            <div v-show="showPicker" class="picker">
              <Picker @select="onEmojiSelect"/>
            </div>
            <!--            <i class="el-icon-picture-outline"/>-->
            <i class="el-icon-folder-opened" @click="selectFile"/>
            <form method="post" enctype="multipart/form-data">
              <input ref="fileInput" type="file" style="display:none" @change="onFileChange"/>
            </form>
          </div>

          <div class="input-content">
            <div style="flex: 1">
              <el-input
                v-model="inputText"
                type="textarea"
                placeholder="协助TA"
                @keyup.enter.native="sendMessage"
                :rows="4"
                :disabled="this.conversationStatus == 0"
              />
            </div>
            <!--            <div class="input-send">-->
            <!--              <el-button-->
            <!--                size="small"-->
            <!--                class="input-send-btn"-->
            <!--                type="primary"-->
            <!--                @click="sendMessage"-->
            <!--              >发送-->
            <!--              </el-button>-->
            <!--            </div>-->
          </div>

        </div>
      </div>
      <div v-else style="flex: 1;">
        <span style="margin-top: 250px; display: block; text-align: center">暂时没有消息</span>
      </div>
    </div>

    <!-- 右边栏 -->
    <div v-if="conversation" class="right-container">
      <div style="background: #ffffff">访客信息</div>
      <el-card shadow="always">
        访客用户名： <br>
        {{ getContact(conversation).username }}
      </el-card>
      <el-card shadow="always">
        访客id标识： <br>
        {{ getContact(conversation).id }}
      </el-card>
      <el-card shadow="always">
        访问时间： <br>
        {{ formatDate(getContact(conversation).createdAt) }}
      </el-card>
      <el-button
        type="primary"
        style="width:100%;margin-bottom:30px;"
        @click="endConversation"
      >
        结束会话
      </el-button>
    </div>
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
import messageApi from '@/api/message'
import { parseTime } from '@/utils/date'
import ContextMenu from '@/components/common/ContextMenu'
import COS from 'cos-js-sdk-v5'
import { Decrypt, Encrypt } from '@/utils/AesEncryptUtil'
import { Picker } from 'emoji-mart-vue'
import { removeId } from '@/utils/id'

export default {
  components: {
    ContextMenu,
    Picker
  },
  data() {
    return {
      statusFilter: (item) => item.status === 1,
      selectConversationIndex: 0,
      reconnectInterval: null,
      isReConnedted: false,
      visitorKey: '',
      showPicker: false,
      url: '',
      file: null,
      cos: null,
      bucket: 'customer-1312794111', // 替换为您自己的存储桶名称
      region: 'ap-nanjing', // 替换为您自己的存储桶所在的地域
      conversationStatus: 1,
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
      contextMenuItems: ['撤回消息'],
      selectedMessageId: -1,
      selectedMessageIndex: -1,
      currentContextMessage: null,
      messageList: [], // 聊天信息列表
      conversationList: [], // 会话列表
      conversation: null, // 当前选中的会话
      // 选择的会话的联系人id
      listQuery: {
        userId: 0,
        contactUserId: 0,
        lessMessageId: 0
      }, // 列表查询条件

      topLoading: false,
      stopTopLoading: false, // 是否停止传播滚动到顶部事件
      isUpperLaoding: false,
      isRefreshedAll: false,

      clientHeight: window.innerHeight, // 浏览器高度

      inputText: '', // 输入的文本内容

      socket: null, // socket
      eventDispatcher: null, // 事件派发器
      interval: null, // 间隔执行定时器

      contact: null, // 联系人用户对象
      user: null // 当前用户对象
    }
  },
  computed: {
    filteredConversationList() {
      return this.conversationList.filter(this.statusFilter)
    }
  },

  // 不能操作DOM
  created() {
    this.getConversationList()
  },
  // 可以操作DOM
  mounted() {
    // 允许发送文件，初始化腾讯云 OSS 对象存储 SDK
    this.cos = new COS({
      SecretId: 'AKID0rVwMcfU5bu1uZ0DRtFOL7jAPRIyRoDV', // 替换为您自己的 SecretId
      SecretKey: 'EG6mQtBJEwbAZo02qbDhGl6GDxeBVcev' // 替换为您自己的 SecretKey
    })
    document.addEventListener('click', (event) => {
      const contextMenu = document.querySelector('.context-menu')
      if (contextMenu && !contextMenu.contains(event.target)) {
        this.hideContextMenu()
      }
    })
    // 浏览器高度
    this.clientHeight = document.documentElement.clientHeight
    window.onresize = () => {
      this.clientHeight = document.documentElement.clientHeight
    }

    // 事件派发器
    this.eventDispatcher = new EventDispatcher()
    // 监听事件
    this.listenEvent()

    const _this = this
    // 如果连接建立成功
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

        // 派发接收数据事件,收到解码后的数据包
        _this.eventDispatcher.dispatchEvent(packet.command, packet)
      }

      // 连接建立后自动进行一次握手和开启心跳检测
      this.socket.onopen = function(event) {
        console.log(`连接建立 ${JSON.stringify(event)}`)
        if (_this.isReConnedted) {
          clearInterval(_this.reconnectInterval)
          _this.isReConnedted = false
        }
        // 心跳检测
        _this.heartCheck()
        // socket连接成功后，发送握手数据包
        _this.loginNetty()
      }

      // 连接关闭
      this.socket.onclose = function(event) {
        console.log(`连接已关闭 ${JSON.stringify(event)}`)
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
    endConversation() {
      const _this = this
      console.log(`结束会话 ${this.conversation.status}`)
      const id = this.conversation.id
      // 会话接口结束状态
      conversationApi.updateConversationEnd(id).then(res => {
        if (res.status === 200) {
          // 从会话list中移除这个会话
          _this.conversationList.splice(_this.conversationList.findIndex((item) => item.id === id), 1)
          // 移除之后页面恢复到暂时没有消息状态
          _this.conversation = null
          console.log('会话结束状态更新成功')
        }
      })
    },
    formatDate(timestamp) {
      const date = new Date(timestamp)
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      console.log(`${year}-${month}-${day}`)
      return `${year}-${month}-${day}`
    },
    // 二次握手,交换密钥
    secondHandShakeHandler() {
      const data = {
        sessionId: this.conversation.id,
        visitorId: this.contact.id,
        serverId: this.user.id
      }
      this.sendPacket(createPacket(data, Command.SECOND_HAND_SHAKE_REQUEST))
      console.log(`发送二次握手数据包 ${JSON.stringify(data)}`)
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
    sendMessageOSS(type) {
      // 如果连接已经关闭则重新连接
      if (this.socket.readyState === WebSocket.CLOSED) {
        this.createWebSocket()
      }
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
    parseTime(time, cFormat) {
      return parseTime(time, cFormat)
    },
    // 滚动到聊天框底部
    scrollToBottom() {
      const _this = this
      this.$nextTick(() => {
        const scrollContainer = _this.$el.querySelector('#scrollLoader-container')
        scrollContainer.scrollTop = scrollContainer.scrollHeight - scrollContainer.clientHeight
      })
    },
    // 获取会话列表
    getConversationList() {
      conversationApi.getConversationList(this.$store.getters.id).then((response) => {
        if (response.status === 200) {
          this.conversationList = response.data
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
            // 监听滚动
            _this.listenMessageScroll()
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
        console.log('连接没有开启，数据包发送失败')
      }
    },
    // 事件监听
    listenEvent() {
      const _this = this

      // 第一次握手响应
      this.eventDispatcher.addListener(Command.LOGIN_RESPONSE, packet => {
        if (packet.success) {
          // 当前用户信息
          _this.user = packet.user
          console.log(`握手成功 ${JSON.stringify(packet)}`)
          // 获取自己的身份密钥
          this.secretKey = packet.secretKey
          console.log(`握手成功\n握手响应内容：${JSON.stringify(packet)}，\n获取密钥 ${this.secretKey}`)
        }
      })

      // 二次握手响应，获取访客的密钥存到sessionStorage里
      this.eventDispatcher.addListener(Command.SECOND_HAND_SHAKE_RESPONSE, packet => {
        // if (packet.success) {
        console.log(`二次握手成功\n二次握手响应内容：${JSON.stringify(packet)},保存为访客${this.contact.id}密钥`)
        sessionStorage.setItem(this.contact.id, packet.visitorKey)
        // }
      })
      // 消息响应
      this.eventDispatcher.addListener(Command.MESSAGE_RESPONSE, packet => {
        if (packet.fromUserId !== _this.contact.id && packet.fromUserId !== _this.user.id) {
          return
        }
        // if (!this.isOneself(packet)) {
        // 如果对方发送的，则用对方的密钥解密
        // 从sessionStorage中获取访客的密钥，并通过访客的密钥解密消息内容数据
        //   const visitorKeyNow = sessionStorage.getItem(this.contact.id)
        //   let decrypt = Decrypt(packet.content, visitorKeyNow)
        //   packet.content = decrypt
        // } else {
        // 如果是自己发送的，则用自己的密钥解密
        packet.content = Decrypt(packet.content, _this.secretKey)
        // }
        _this.messageList.push(packet)
        _this.scrollToBottom()
        console.log(`收到信息 ${JSON.stringify(packet)}`)
      })
      // 已读通知回调
      this.eventDispatcher.addListener(Command.READ_RESPONSE, packet => {
        if (packet.contactUserId !== _this.contact.id) {
          return
        }
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
        if (packet.contactUserId !== _this.contact.id) {
          return
        }
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
      // 会话创建通知回调
      this.eventDispatcher.addListener(Command.CREATE_CONVERSATION_RESPONSE, packet => {
        console.log(`收到创建会话通知 ${JSON.stringify(packet)}`)
        // 加入会话列表
        this.conversationList.push(packet.conversation)
      })
      // 结束会话通知回调
      this.eventDispatcher.addListener(Command.END_CONVERSATION_RESPONSE, packet => {
        console.log(`结束会话通知 ${JSON.stringify(packet)}`)
        if (packet.success) {
          const id = packet.conversationId
          // 从会话list中移除这个会话
          _this.conversationList.splice(_this.conversationList.findIndex((item) => item.id === id), 1)
          // 移除之后会话页面恢复到暂时没有消息状态
          _this.conversation = null
          console.log('会话结束状态更新成功')
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
    // 每15秒尝试重新连接一次，直到连接成功就刷新浏览器
    recover() {
      const _this = this
      this.reconnectInterval = setInterval(function() {
        console.log('尝试重新连接...')
        _this.createWebSocket()
      }, 15000) // 每15秒尝试重新连接一次
    },
    // 握手
    loginNetty() {
      const data = {
        username: this.$store.getters.userInfo.username
      }
      this.sendPacket(createPacket(data, Command.LOGIN_REQUEST))
    },
    // 发送信息
    sendMessage() {
      // 如果连接已经关闭则重新连接，需要重新握手
      if (this.socket.readyState === WebSocket.CLOSED) {
        console.log(`连接已关闭，正在重新握手`)
        this.createWebSocket()
      }
      console.log(`发送信息:${this.inputText},使用密钥${this.secretKey}加密`)
      const data = {
        conversationId: this.conversationId,
        content: Encrypt(this.inputText, this.secretKey),
        type: 1,
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
    // 选择会话
    handleConversation(conversation) {
      // console.log(`选择会话索引:${conversation.$index}，会话内容:${JSON.stringify(conversation)}`)
      // this.selectConversationIndex = index
      this.conversation = conversation
      this.contact = this.getContact(conversation)
      this.messageList = []
      this.listQuery.userId = this.user.id
      this.listQuery.contactUserId = this.contact.id
      this.listQuery.lessMessageId = 0

      this.getMessageList()
      // 判断SessionStorage中是否存在键为选中的访客id的值
      if (!(this.contact.id in sessionStorage)) {
        // 键不存在，则进行二次握手获取对方密钥
        this.secondHandShakeHandler()
      }
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
    listenMessageScroll() {
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
            _this.getMessageList(topDone)
          }
        }
      }, 50)
    }
  }
}
</script>

<style rel="stylesheet/scss" lang="scss" scoped>
> > > .el-input-number .el-input__inner.el-textarea__inner {
  border: 0;
  resize: none;
}

.picker {
  position: absolute;
  top: -420px;
  /*transform: translateX(-240px);*/
  /*transform: translateY(-60%);*/
}

ul {
  display: block;
  list-style-type: disc;
  margin-block-start: 1em;
  margin-block-end: 1em;
  margin-inline-start: 0;
  margin-inline-end: 0;
  padding-inline-start: 0;
}
</style>

<style scoped>
.audio-container {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
}

audio {
  width: 100%;
  height: 50px;
}

.video-container {
  max-width: 100%;
  max-height: 500px;
  overflow: hidden;
}

video {
  width: 100%;
  height: auto;
  display: block;
}

.app-container {
  background-color: #ffffff;
  z-index: 100;
  overflow: hidden;
  min-width: 400px;
  margin: 0 auto;
  padding: 0;
  display: flex;
  display: -webkit-flex;
  flex-direction: row;
}

.left-container {
  width: 250px;
}

.center-container {
  flex: 1;
}

.right-container {
  width: 250px;
}

.chat-container {
  display: flex;
  display: -webkit-flex;
  flex-direction: column;
  height: 100%;
  border-left: 1px solid #EBEEF5;
  border-right: 1px solid #EBEEF5;
}

.chat-nav {
  text-align: center;
  width: 100%;
  height: 50px;
  line-height: 50px;
  font-size: 14px;
  border-bottom: 1px solid #EBEEF5;
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

.message {
  padding: 10px 15px;
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
  box-shadow: 0 1px 7px -5px #000;
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

.scroll-container {
  margin: 0 auto;
  overflow: auto;
  overflow-x: hidden;
  padding: 0;
  flex: 1;
  width: 100%;
}

.message-container {
  overflow-x: hidden;
  flex: 1;
  width: 100%;
}

.loading {
  width: 100%;
  height: 40px;
  position: relative;
  overflow: hidden;
  text-align: center;
  margin: 5px 0;
  font-size: 13px;
  color: #b0b0b0;
  line-height: 100px;
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
