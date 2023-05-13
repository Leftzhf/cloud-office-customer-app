import Cookies from 'js-cookie'

const idKey = 'socket_visitor_id'

/**
 * 获取cookie中的唯一标识
 */
export function getId() {
  let id = Cookies.get(idKey)
  // 如果cookie不存在，则新建
  if (!id) {
    id = genNoDuplicateId()
    // 六小时过期
    Cookies.set(idKey, id, { expires: expiredHours(6) })
  }
  console.log(`唯一标识 ${id}`)
  return id
}

export function removeId() {
  Cookies.remove(idKey)
}

/**
 * 生成不重复ID
 */
function genNoDuplicateId() {
  return (Math.random() * 10000000).toString(16).substr(0, 4) + '-' + (new Date()).getTime() + '-' + Math.random().toString().substr(2, 5)
}

function expiredHours(hours) {
  const now = new Date() // 获取当前时间
  const expiresTime = new Date(now.getTime() + hours * 60 * 60 * 1000) // 计算过期时间
  return expiresTime
}
