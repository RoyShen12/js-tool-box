import _ from 'lodash'

export default {
  isIE: () => {
    return /msie/i.test(navigator.userAgent) || (navigator.userAgent.toLowerCase().indexOf('trident') !== -1 && navigator.userAgent.indexOf('rv') !== -1)
  },
  /**
   * 数值范围比较函数
   * @param {Number} target - 待比较的数字
   * @param {Number} rangeS - 上界
   * @param {Number} rangeE - 下界
   */
  inRange: (target, rangeS, rangeE) => target > rangeS && target < rangeE,
  inRangeL: (target, rangeS, rangeE) => target >= rangeS && target < rangeE,
  inRangeR: (target, rangeS, rangeE) => target > rangeS && target <= rangeE,
  inRangeLR: (target, rangeS, rangeE) => target >= rangeS && target <= rangeE,
  /**
   * @param {Object} obj 目标对象
   * @param {(key: string|number, value: any) => void} callback 回调函数
   * @param {Boolean} onlyOwnEnumerable 是否仅迭代自身可枚举属性
   */
  objectForEach: (obj, callback, onlyOwnEnumerable = true) => {
    if (Object.prototype.toString.call(obj) !== '[object Object]') {
      throw new TypeError('expected object but ' + Object.prototype.toString.call(obj) + '.')
    }
    for (const k in obj) {
      if (!onlyOwnEnumerable || Object.hasOwnProperty.call(obj, k)) {
        callback(k, obj[k])
      }
    }
  },
  /**
   * 从源对象向目标对象不覆盖地赋值，两个对象应具有大多相同的属性
   * @param {Object} leftObject - 目标对象
   * @param {Object} rightObject - 源对象
   * @param {Boolean} isDeepClone - 是否深拷贝，默认为浅拷贝
   * @return {Object} - 目标对象的引用
   */
  assignment: (leftObject, rightObject, isDeepClone = false) => {
    const tinyVlBlk = targetParam => targetParam === '' || targetParam === null || targetParam === undefined
    for (let rkey in rightObject) {
      // 当源的某个属性在目标中存在时，当且仅当源中的此值非空，则向目标赋值；不存在于目标的属性则直接插入源
      if (Object.hasOwnProperty.call(leftObject, rkey)) {
        if (!tinyVlBlk(rightObject[rkey])) {
          if (isDeepClone) {
            leftObject[rkey] = _.cloneDeep(rightObject[rkey])
          } else {
            leftObject[rkey] = rightObject[rkey]
          }
        }
      } else {
        if (isDeepClone) {
          leftObject[rkey] = _.cloneDeep(rightObject[rkey])
        } else {
          leftObject[rkey] = rightObject[rkey]
        }
      }
    }
    return leftObject
  },
  /**
   * 判断指定的元素在目标数组中是否仅占少数比例
   * @template T
   * @param {T[]} arr 目标数组
   * @param {number} miPercentage 目标百分比 (0-1)，认为指定的元素在目标数组中占比小于此值则的确“占少数”
   * @param {T} targetElem 目标元素
   * @param {(a: T, b: T) => boolean} cFx 比较函数，返回 true 则认为元素 a, b “相同”
   */
  isMinority: (arr, miPercentage, targetElem, cFx) => {
    const L = arr.length
    let targetSameCount = 0
    for (const ele of arr) {
      if (cFx(ele, targetElem)) {
        ++targetSameCount
      }
    }
    return (targetSameCount / L) < miPercentage
  },
  /**
   * - 稳定排序方法，只适用于对元素皆为对象的数组使用
   * @note - chrome为了运行速度在Array.prototype.sort使用了不稳定排序，
   *    在某些情况下会导致未定义的行为，尤其是在一次sort后继续进行下一次sort并且大多数元素无需交换位置时
   *    会出现元素位置的错乱，此问题的复现测试代码：
   * @example
   *    let test = []
   *    for (let i = 0;i < 100;i++) {test.push({a: (Math.random()<0.5?'a':'s')+(Math.random()<0.5?'0':'1')+(~~(Math.random()*10))})}
   *    test.sort((a, b) => a.a.localeCompare(b.a)).sort(() => 0)
   * @require Proxy原生支持或Polyfill
   * @param {Array} TargetArray - 元素皆为对象的数组，任一元素皆可访问到{PropertyToCompare}
   * @param {string | symbol | number} PropertyToCompare - 对象中待比较的属性名
   * @param {CallableFunction} cFx - 符合javascript标准的比较函数，默认为减法，必须对每两个参数返回一个数字
   * @returns {void}
   */
  stableSorting: (TargetArray, PropertyToCompare, cFx = (ela, elb) => ela - elb) => {
    const indexSymbol = Symbol.for('index_for_stable_sorting_marking')

    let index = 0

    if (!Array.isArray(TargetArray)) {
      throw new TypeError('expected parameter 0 as an array')
    }

    const tmp_typestr = Object.prototype.toString.call(PropertyToCompare)

    if (tmp_typestr != '[object String]' &&
      tmp_typestr != '[object Symbol]' &&
      tmp_typestr != '[object Number]') {
      throw new TypeError('expected parameter 1 as a valid property name')
    }

    if (TargetArray.some(v => !(PropertyToCompare in v))) {
      throw new TypeError('expected parameter 1 as an property name which is owned by every elements in parameter 0')
    }

    TargetArray.forEach(v => v[indexSymbol] = index++)

    cFx = new Proxy(cFx, {
      apply: function (target, thisArg, argumentsList) {
        const return_value = Reflect.apply(target, thisArg, argumentsList)
        if (return_value === 0) return argumentsList[2][indexSymbol] - argumentsList[3][indexSymbol]
        else return return_value
      }
    })

    TargetArray.sort((a, b) => cFx(a[PropertyToCompare], b[PropertyToCompare], a, b))

    TargetArray.forEach(v => delete v[indexSymbol])
  },
  /**
   * - 返回一个比较某个属性的比较函数，通常用于作为Array.sort()的参数，如对数组A的b属性排序：A.sort(util.compareProperties('b'))
   * @param {string} properties - 对象中待比较的属性名
   * @param {CallableFunction} cFx - 符合javascript标准的比较函数，默认为减法，必须对每两个参数返回一个数字
   * @param {boolean} ascend - 升降序，默认为升序
   * @returns {CallableFunction} - 需要返回的结果比较函数
   */
  compareProperties: (properties, cFx = (ela, elb) => ela - elb, ascend = true) => (a, b) => cFx(a[properties], b[properties]) * (ascend ? 1 : -1),
  /**
   * 返回一个比较某些属性的比较函数，通常用于作为Array.sort()的参数
   * 如对数组A的b属性和c属性排序：A.sort(util.compareMultiProperties(['b', 'c'], [cf1, cf2])) *cf1, cf2为外部定义的比较函数
   * 其中先比较b属性，b属性相同的元素再比较c属性
   * @param {string} propertiesArray - 对象中待比较的属性名组
   * @param {CallableFunction} cFx - 符合javascript标准的比较函数组
   * @returns {CallableFunction} - 需要返回的结果比较函数
   */
  compareMultiProperties: (propertiesArray, cFxArray) => {
    if (!Array.isArray(propertiesArray) || !Array.isArray(cFxArray) || propertiesArray.length == 0 || propertiesArray.length != cFxArray.length) {
      throw new TypeError('expected parameter as two arrays which have the same length')
    }
    return (a, b) => {
      let deepth = 0
      while (deepth != propertiesArray.length && cFxArray[deepth](a[propertiesArray[deepth]], b[propertiesArray[deepth]]) == 0) deepth++
      return deepth == propertiesArray.length ? 0 : cFxArray[deepth](a[propertiesArray[deepth]], b[propertiesArray[deepth]])
    }
  },
  guid: () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      var r = Math.random() * 16 | 0,
        v = c == 'x' ? r : (r & 0x3 | 0x8)
      return v.toString(16)
    })
  },
  /**
   * - 返回指定位数的16进制随机字符串
   * @param {number} bits - 字符串的长度
   */
  randomStr: bits => {
    let ret = ''
    for (let index = 0; index < bits; index++) {
      ret += ((Math.random() * 16 | 0) & 0xf).toString(16)
    }
    return ret
  },
  /**
   * @param {{ [k:string]:string }} obj
   */
  objectToKvArray: (obj, key = 'key', value = 'value') => {
    return _.toPairs(obj).map(pair => ({ [key]: pair[0], [value]: pair[1] }))
  },
  /**
   * - 返回输入字符串中的数字
   * @param {string} str - 字符串
   */
  numberScreenOut: str => {
    if (Object.prototype.toString.call(str) !== '[object String]') return NaN
    return Number(''.concat(...[].concat(...str).filter(C => !isNaN(parseInt(C)))))
  },
  /**
   * - 返回输入字符串中的非数字
   * @param {string} str - 字符串
   */
  nonnumerScreenOut: str => {
    if (Object.prototype.toString.call(str) !== '[object String]') return ''
    return ''.concat(...[].concat(...str).filter(C => isNaN(parseInt(C))))
  },
  /**
   * - 返回输入字符串中每组连续数字组成的数组
   * @param {string} str - 字符串
   */
  numberArrayScreenOut: str => {
    if (Object.prototype.toString.call(str) !== '[object String]') return []
    return str.split(/\D/g).filter(S => S).map(N => +N)
  },
  /**
   * - Date 对象转时间字符串：YYYY-MM-DDT00:00:00.000Z
   * @param {Date} DateObj - 时间对象
   * @returns {string} 转换后的字符串
   */
  DateToStandardString: DateObj => {
    if (typeof (DateObj) !== 'object') {
      throw new TypeError('DateToStandardString: requires Date but ' + typeof DateObj)
    }

    const year = DateObj.getFullYear()
    const month = DateObj.getMonth() < 9 ? '0' + (DateObj.getMonth() + 1) : (DateObj.getMonth() + 1)
    const day = DateObj.getDate() < 10 ? '0' + DateObj.getDate() : DateObj.getDate()
    return year + '-' + month + '-' + day + 'T00:00:00.000Z'
  },
  /**
   * - Date 对象转时间字符串：YYYY-MM-DD HH:MM[:SS]
   * @param {Date} DateObj - 时间对象
   * @param {boolean} [showSEC] - 是否显示秒
   * @returns {string} 转换后的字符串
   */
  DateTimeToString: (DateObj, showSEC) => {
    if (typeof (DateObj) !== 'object') {
      throw new TypeError('DateTimeToString: requires Date but ' + typeof DateObj)
    }

    const year = DateObj.getFullYear()
    const month = DateObj.getMonth() < 9 ? '0' + (DateObj.getMonth() + 1) : (DateObj.getMonth() + 1)
    const day = DateObj.getDate() < 10 ? '0' + DateObj.getDate() : DateObj.getDate()
    const hour = DateObj.getHours() < 10 ? '0' + DateObj.getHours() : DateObj.getHours()
    const minute = DateObj.getMinutes() < 10 ? '0' + DateObj.getMinutes() : DateObj.getMinutes()
    const second = showSEC ? DateObj.getSeconds() < 10 ? ':0' + DateObj.getSeconds() : ':' + DateObj.getSeconds() : ''
    return year + '-' + month + '-' + day + ' ' + hour + ':' + minute + second
  },
  /**
   * - Date 对象转日期字符串：YYYY-MM-DD
   * @param {Date} DateObj - 时间对象
   * @returns {string} 转换后的字符串
   */
  DateToString: DateObj => {
    if (typeof (DateObj) !== 'object') {
      throw new TypeError('DateToString: requires Date but ' + typeof DateObj)
    }
    const year = DateObj.getFullYear()
    const month = DateObj.getMonth() < 9 ? '0' + (DateObj.getMonth() + 1) : (DateObj.getMonth() + 1)
    const day = DateObj.getDate() < 10 ? '0' + DateObj.getDate() : DateObj.getDate()
    return year + '-' + month + '-' + day
  },
  /**
   * - 时间字符串和时间数字互相转换
   * @example
   * '2018-01-01 02:03:04' <-> 20180101020304
   * @param {string | number} target
   */
  DateStringNumberMutualConversion(target) {
    const typeStr = Object.prototype.toString.call(target)

    if (typeStr == '[object String]') {
      if (!/^\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}$/.test(target)) {
        return 0
      }
      else {
        return +target.replace(/[-,\s,:]/g, '')
      }
    }
    else if (typeStr == '[object Number]') {
      if (target < 0) {
        return '-'
      }
      else {
        let targetArr = Array.from(target + '') // ['2', '0', '1', '8', ...]
        console.assert(targetArr.length === 14, 'unexpected number length ' + target)
        targetArr.splice(4, 0, '-')
        targetArr.splice(7, 0, '-')
        targetArr.splice(10, 0, ' ')
        targetArr.splice(13, 0, ':')
        targetArr.splice(16, 0, ':')
        return ''.concat(...targetArr) // 2018-09-20 16:00:00
      }
    }
  },
  /**
   * - 更友好的时间描述文字
   * @example
   * FriendTimeSpanHint('2018-08-10 15:57:08') --> '3分钟前'
   * @param {String|Date} time - 时间字符串（YYYY-MM-DD HH:MM:SS）或Date对象
   * @param {Boolean} [simple] - 是否启用简略结果
   * @returns {String} 更友好的时间描述文字
   */
  FriendTimeSpanHint: (time, simple) => {
    const now = (new Date()).getTime()

    const targetTimeObj = Object.prototype.toString.call(time) == '[object Date]' ? time : new Date(time)

    const targetTime = targetTimeObj.getTime()

    if (isNaN(targetTime)) return ''

    const disparitySeconds = (now - targetTime) / 1000

    if (disparitySeconds < 1) {
      return '1秒前'
    }
    else if (disparitySeconds < 60) {
      return `${disparitySeconds.toFixed(0)}秒前`
    }
    else if (disparitySeconds < 3600) {
      return `${(disparitySeconds / 60).toFixed(0)}分钟前`
    }
    else if (simple) {
      if (disparitySeconds < 86400) {
        const h = Math.round(disparitySeconds / 3600).toFixed(0)
        return `约${h}小时前`
      }
      else {
        const d = Math.floor(disparitySeconds / 86400)
        return `超过${d}天`
      }
    }
    else {
      if (disparitySeconds < 86400) {
        const h = (disparitySeconds / 3600).toFixed(0)
        const m = (disparitySeconds % 3600 / 60).toFixed(0)
        return `${h}小时${m}分钟前`
      }
      else {
        const d = (disparitySeconds / 86400).toFixed(0)
        const h = (disparitySeconds % 86400 / 3600).toFixed(0)
        return `${d}天${h}小时前`
      }
    }
  },
  /**
   * - 获取try catch或后台接口的错误中的message字符串
   * @param {Object} errorObj - 错误对象
   */
  errorMessageFinder(errorObj) {
    console.log('errorMessageFinder')
    console.dir(errorObj)

    if (errorObj.response && errorObj.response.data && (errorObj.response.data.message || errorObj.response.data.Message)) {
      if (errorObj.response.data.Message && errorObj.response.data.Message.indexOf('E11000') !== -1) return '尝试新增已存在的数据'
      return errorObj.response.data.message || errorObj.response.data.Message
    }
    else if (errorObj.message) {
      return errorObj.message
    }
    else {
      return '未知错误'
    }
  },
  /**
   * - 验证是否是数字
   * @param {any} targetParam - 验证目标
   * @param {string} warnMessage - 出错时的弹出警告内容
   * @param {Vue} VueInst - 传入的VUE实例
   * @param {string} [successMessage] - 出错时的弹出警告内容
   * @returns {boolean}
   */
  validateNumber: function (targetParam, warnMessage, VueInst, successMessage) {
    // 对于整数，浮点数返回true，对于NaN或可转成NaN的值返回false
    if (targetParam !== +targetParam) {
      VueInst.$message({
        message: warnMessage,
        type: 'warning'
      })
      return false
    }
    else {
      if (successMessage) {
        VueInst.$message({
          message: successMessage,
          type: 'success'
        })
      }
      return true
    }
  },
  /**
   * - 验证类型是否匹配
   * @param {any} targetParam - 验证目标
   * @param {string} promiseType - 目标类型
   * @param {string} warnMessage - 出错时的弹出警告内容
   * @param {Object} VueInst - 传入的VUE实例
   * @param {string} [successMessage] - 出错时的弹出警告内容
   * @returns {boolean}
   */
  validateType: function (targetParam, promiseType, warnMessage, VueInst, successMessage) {
    if (typeof (targetParam) !== promiseType) {
      VueInst.$message({
        message: warnMessage,
        type: 'warning'
      })
      return false
    }
    else {
      if (successMessage) {
        VueInst.$message({
          message: successMessage,
          type: 'success'
        })
      }
      return true
    }
  },
  /**
   * - 验证是否是空字符串 /null /undefined
   * @param {any} targetParam - 验证目标
   * @param {string} [warnMessage] - 出错时的弹出警告内容
   * @param {Object} [VueInst] - 传入的VUE实例
   * @param {string} [successMessage] - 出错时的弹出警告内容
   * @returns {boolean}
   */
  validateBlank: function (targetParam, warnMessage, VueInst, successMessage) {
    if (!warnMessage) {
      return !(targetParam === '' || targetParam === null || targetParam === undefined)
    }
    else {
      if (targetParam === '' || targetParam === null || targetParam === undefined) {
        VueInst.$message({
          message: warnMessage,
          type: 'warning'
        })
        return false
      }
      else {
        if (successMessage) {
          VueInst.$message({
            message: successMessage,
            type: 'success'
          })
        }
        return true
      }
    }
  },
  /**
   * - 验证是否是合法手机号码
   * @param {any} targetParam - 验证目标
   * @param {string} [warnMessage] - 出错时的弹出警告内容
   * @param {Object} [VueInst] - 传入的VUE实例
   * @param {string} [successMessage] - 出错时的弹出警告内容
   * @returns {boolean}
   */
  validateCNMob: function (targetParam, warnMessage, VueInst, successMessage) {
    const result = /^1[3,4,5,6,7,8,9]\d{9}$/.test(targetParam)
    if (!warnMessage) {
      return result
    }
    else {
      if (!result) {
        VueInst.$message({
          message: warnMessage,
          type: 'warning'
        })
        return false
      }
      else {
        if (successMessage) {
          VueInst.$message({
            message: successMessage,
            type: 'success'
          })
        }
        return true
      }
    }
  },
  /**
   * - 处理 input<file> : v-on:change 事件
   * @param {HTMLInputElement} inputReference - input<file>组件的引用
   * @param {string} readType - 读取文件的类型 text|base64|arraybuffer
   * @param {CallableFunction} callback - 取回文件内容的回调函数
   * @param {CallableFunction} checkTypeFunc - 检查文件类型是否符合，传入字符串type，返回布尔值
   */
  handleInputFileOnChange: (inputReference, readType, callback, checkTypeFunc = () => true) => {
    const file = inputReference.files

    if (file.length !== 0) {

      let fileA = Array.from(file)
      let flag = true

      fileA.forEach(v => {
        flag ? flag = flag && checkTypeFunc(v.type) : void (0)
      })

      if (!flag) {
        return
      }

      const oFReader = new FileReader()

      oFReader.onload = oFREvent => {
        callback(oFREvent.target.result)
      }

      for (let f of fileA) {

        if (readType === 'text') {
          oFReader.readAsText(f)

        } else if (readType === 'base64') {
          oFReader.readAsDataURL(f)

        } else if (readType === 'arraybuffer') {
          oFReader.readAsArrayBuffer(f)
        }
      }
      inputReference.value = ''
    }
  },
  /**
   * @param {ArrayBuffer} buffer
   */
  isUtf8: buffer => {
    let checkSub = 0
    const checkLength = buffer.length
    let allAscii = true
    // check uft8-BOM head
    if (buffer[0] === 0xef && buffer[1] === 0xbb && buffer[2] === 0xbf) {
      return true
    }
    let chr
    for (let i = 0; i < checkLength; i++) {
      chr = buffer[i]
      if ((chr & 0x80) !== 0) allAscii = false
      if (checkSub === 0) {
        if (chr >= 0x80) {
          if (chr >= 0xfc && chr <= 0xfd) checkSub = 6
          else if (chr >= 0xf8) checkSub = 5
          else if (chr >= 0xf0) checkSub = 4
          else if (chr >= 0xe0) checkSub = 3
          else if (chr >= 0xc0) checkSub = 2
          else return false
          checkSub--
        }
      }
      else {
        if ((chr & 0xc0) !== 0x80) return false
        checkSub--
      }
    }
    if (checkSub > 0) return false
    if (allAscii) return false
    return true
  }
}
