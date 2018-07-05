/* eslint-disable */
/**
 * 上传图片，预览，base64编码和删除工具
 * @author shenwenxiao
 */
import tween from './tween'

/**
 * 实用函数 计算元素相对屏幕左上角的绝对偏移
 * - referenced from https://blog.csdn.net/esther_heesch/article/details/51074255
 * @param {HTMLElement} ele - 待计算的html元素
 */
const getOffset = function (ele) {
  const flag = window.navigator.userAgent.indexOf('MSTE 8') > -1
  let top = ele.offsetTop
  let left = ele.offsetLeft
  while (ele.offsetParent) {
    ele = ele.offsetParent
    if (flag) {
      top += ele.offsetTop
      left += ele.offsetLeft
    } else {
      top += ele.offsetTop + ele.clientTop
      left += ele.offsetLeft + ele.clientLeft
    }
  }
  return {
    x: left,
    y: top
  }
}

export default {
  /**
   * 处理 input<file> : v-on:change 事件
   * @param {HTMLElement} inputReference - input<file>组件的引用
   * @param {VUE} vueInstance - vue实例,通常传this
   * @param {Object} paramContainer - 图片编码存放数组的引用的对象
   * @param {String} imageProName - {paramContainer}中访问图片编码存放数组的属性名
   * @param {Number} maxWidth - 裁剪后的最大宽度
   * @param {Number} compressionQuality - 质量压缩比例 0.1~1.0
   */
  handlePreview(inputReference, vueInstance, paramContainer, imageProName, maxWidth = 1920, compressionQuality = 0.5) {
    // 获取上传的文件对象
    const file = inputReference.files
    // 文件列表为空？
    if (file.length !== 0) {
      // 判断是否是正确的图片文件
      let flag = true
      let fileA = Array.from(file)
      // console.log(fileA)
      fileA.forEach(v => {
        flag = flag && !/image\//.test(v.type)
      })
      if (flag) {
        vueInstance.$message({
          type: 'warn',
          message: '请选择正确的图片文件'
        })
      } else {
        // 新建FileReader实例（IE10+）
        const oFReader = new FileReader()
        // 为FileReader创建回调事件，以便于加载预览至img标签
        oFReader.onload = (oFREvent) => {
          // 新建HTMLImageElement实例（IE9+）
          const image = new Image()
          image.crossOrigin = 'Anonymous'
          let dataURL = null
          // 为Image创建回调事件，以便于加载预览及创建base64编码
          image.onload = () => {
            // HTMLCanvas
            const canvas = document.createElement('canvas')
            const ctx = canvas.getContext('2d')
            // 等比例裁剪
            let rate = image.width > maxWidth ? (maxWidth / image.width) : 1
            // canvas确定大小
            canvas.height = image.height * rate
            canvas.width = image.width * rate
            // 在canvas绘制上传的图片
            // ctx.drawImage(image, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight) : void
            // console.log(width, height)
            ctx.drawImage(image, 0, 0, image.width, image.height, 0, 0, image.width * rate, image.height * rate)
            // 在canvas中裁剪、压缩并输出base64编码
            dataURL = canvas.toDataURL('image/jpeg', compressionQuality)
            // 存入param对象，更新页面，在新增/更新时传送至后台
            if (Array.isArray(paramContainer[imageProName])) {
              paramContainer[imageProName].push(dataURL)
            } else {
              paramContainer[imageProName] = []
              paramContainer[imageProName].push(dataURL)
            }
          }
          // 加载Image
          image.src = oFREvent.target.result
        }
        // FileReader 解析待上传的文件
        for (let f of fileA) {
          oFReader.readAsDataURL(f)
        }
        inputReference.value = ''
      }
    }
  },
  /**
   * 图片元素放大
   * 必须有max-height,max-width属性和data-full（默认'false'）属性。
   * 可选的参数可以指出图片是由url的后缀指定尺寸的缩略图，这样在执行本函数时会尝试截去url的后缀以获取到原始大小的图片
   * @param {HTMLElement} imgNode - <img>标签的引用
   * @param {Boolean} hasCliped - 图片是否是由url的后缀指定尺寸的缩略图
   */
  previewFullScreen(imgNode, hasCliped = false) {
    // 获取保留高度
    const topBarH = config.topBarHeight + 4
    // 注入初始大小
    imgNode.dataset.oriHeight === undefined ? imgNode.dataset.oriHeight = imgNode.style.maxHeight : void (0)
    imgNode.dataset.oriWidth === undefined ? imgNode.dataset.oriWidth = imgNode.style.maxWidth : void (0)
    if (imgNode.dataset.full === 'false') {
      // 蒙版
      const masking = document.createElement('div')
      masking.id = 'img_full_masking'
      masking.style.display = 'block'
      masking.style.position = 'fixed'
      masking.style.top = topBarH + 'px'
      masking.style.bottom = masking.style.left = masking.style.right = '0px'
      masking.style.zIndex = '2998'
      masking.style.backgroundColor = '#fff'
      masking.style.opacity = '0.5'
      masking.style.margin = '0px'
      masking.style.overflow = 'auto'
      // 蒙版挂载到body
      document.body.appendChild(masking)
      // 创建新节点
      const full_node = imgNode.cloneNode(false)
      // 新节点的点击事件（取消全屏）
      full_node.addEventListener('click', evt => {
        // 点击后：移除蒙版和全屏图片
        document.body.removeChild(document.getElementById('img_full_masking'))
        document.body.removeChild(document.getElementById('full_screen_img_node'))
        // 去锁
        imgNode.dataset.full = 'false'
      })
      full_node.id = 'full_screen_img_node'
      full_node.src = imgNode.src
      if (hasCliped) {
        full_node.src = full_node.src.replace(/(_)\d+(x)\d+(.)/, '.')
      }
      full_node.style.zIndex = '2999'
      full_node.style.position = 'fixed'
      full_node.style.margin = 'auto'
      full_node.style.left = '0px'
      full_node.style.right = '0px'
      full_node.style.top = topBarH + 'px'
      full_node.style.bottom = '0px'
      // 全屏图片挂载到body
      document.body.appendChild(full_node)
      // 加锁
      imgNode.dataset.full = 'true'

      // 动画：宽
      tween.tween(Number.parseInt(imgNode.dataset.oriWidth), document.body.clientWidth, 500, tween.easeOutExpo, width => {
        full_node.style.maxWidth = width + 'px'
      })
      // 动画：高
      tween.tween(Number.parseInt(imgNode.dataset.oriHeight), document.body.clientHeight - topBarH, 500, tween.easeOutExpo, height => {
        full_node.style.maxHeight = height + 'px'
      })
    }
  },
  /**
   * 删除一组base64图片中的一个
   * @param {Number} index - 图片编码存放数组中欲删除的图片的索引
   * @param {Object} paramContainer - 图片编码存放数组的引用的对象
   * @param {String} imageProName - {paramContainer}中访问图片编码存放数组的属性名
   */
  deleteImageProc(index, paramContainer, imageProName) {
    paramContainer[imageProName].splice(index, 1)
  },
  /**
   * 获取缩略图地址
   * @param {String} oriPath 
   * @param {Number} height
   * @param {Number} width 
   */
  getThumbnailPath(oriPath, width, height) {
    const insertBeforeIndex = function (thisstr, index, string) {
      const front = thisstr.substring(0, index)
      const rear = thisstr.substring(index)
      return front + string + rear
    }
    return insertBeforeIndex(oriPath, oriPath.lastIndexOf('.'), '_' + width + 'x' + height)
  },
  /**
   * 图片放大镜效果
   * add on 2018/6/26
   * @param {HTMLImageElement} imgNode - <img>标签的引用
   * @param {Object} option - 参数，可以只提供部分属性，如 magnifierOnMouseMove(img, {hasCliped: true})
   *    - hasCliped: 图片是否是由url的后缀指定尺寸的缩略图 
   *    - mountNode: 放大镜挂载的目的Node，默认是document.body 
   *    - magnifierSize: 放大镜尺寸 
   *    - srcMagChunkSize: 图片放大的源块大小 放大倍率等于 magnifierSize / srcMagChunkSize 
   *    - magPosition: 放大镜放置位置 
   *      -- relative-mouse: 相对鼠标偏移 (默认) 
   *      -- fixed: 相对屏幕左上角偏移（固定位置） 
   *      -- relative-src: 相对源<img>标签偏移 
   *    - magPositionX: 放大镜水平偏移量，偏移方式由magPosition决定，负值向左，正值向右，fixed模式时负值将隐藏放大镜 
   *    - magPositionY: 放大镜垂直偏移量，偏移方式由magPosition决定，负值向上，正值向下，fixed模式时负值将隐藏放大镜 
   *    - maskingColor: 蒙版颜色，默认白色 
   *    - maskingOpacity: 蒙版透明度。默认50% 
   * @param {Function} callback - 可选的回调函数，每次imgNode的onmousemove触发时都会执行此函数并传入此次鼠标事件的引用 
   */
  magnifierOnMouseMove(imgNode, option = {
    hasCliped: false,
    mountNode: document.body,
    magnifierSize: 420,
    srcMagChunkSize: 200,
    magPosition: 'relative-mouse',
    magPositionX: -420,
    magPositionY: 0,
    maskingColor: '#ffffff',
    maskingOpacity: 0.5
  }, callback = function (){}) {

    if (!imgNode || !(imgNode instanceof HTMLImageElement)) {
      return
    }
    // 如果只提供了部分参数，补全其他参数
    option = Object.assign({
      hasCliped: false,
      mountNode: document.body,
      magnifierSize: 420,
      srcMagChunkSize: 210,
      magPosition: 'relative-mouse',
      magPositionX: -422,
      magPositionY: 0,
      maskingColor: '#ffffff',
      maskingOpacity: 0.5
    }, option)
    // 如果目标不是html Node，拒绝执行
    if (!(option.mountNode instanceof Node)) {
      return
    }
    // 如果期望相对源图像定位放大镜，并且源图像不存在x/y属性（IE浏览器），则事先计算出其绝对偏移
    if (option.magPosition === 'relative-src' && !imgNode.x && !imgNode.y) {
      const ofs = getOffset(imgNode)
      imgNode.x = ofs.x
      imgNode.y = ofs.y
    }
    let canvas
    let ctx
    // create canvas
    if (!document.getElementById('__magnifier__pic__')) {
      canvas = document.createElement('canvas')
      canvas.id = '__magnifier__pic__'
      ctx = canvas.getContext('2d')
      // canvas 内秉宽高
      canvas.height = option.magnifierSize
      canvas.width = option.magnifierSize
      // canvas元素宽高
      canvas.style.height = option.magnifierSize + 'px'
      canvas.style.width = option.magnifierSize + 'px'
      canvas.style.zIndex = '3998'
      canvas.style.position = 'fixed'
      canvas.style.border = '1px solid #000'
      // 阻止接受鼠标事件(IE11)
      canvas.style.pointerEvents = 'none'
      ctx.fillRect(0, 0, option.magnifierSize, option.magnifierSize)
    } else {
      canvas = document.getElementById('__magnifier__pic__')
      ctx = canvas.getContext('2d')
      ctx.fillRect(0, 0, option.magnifierSize, option.magnifierSize)
    }
    // canvas.onmousemove = evt => evt.preventDefault()
    // canvas.onmouseout = evt => evt.preventDefault()
    // canvas.onmouseover = evt => evt.preventDefault()
    // （IE9+）
    const image = new Image()
    image.crossOrigin = 'anonymous'
    if (option.hasCliped) {
      image.src = imgNode.src.replace(/(_)\d+(x)\d+(.)/, '.')
    } else {
      image.src = imgNode.src
    }
    // mouse move over imgnode
    imgNode.onmousemove = evt => {
      evt.stopPropagation()
      try {
        callback(evt)
      } catch (error) {
      }
      // create the magnifier
      if (!document.getElementById('__magnifier__pic__')) {
        console.log('append magnifier canvas on body')
        option.mountNode.appendChild(canvas)
      }
      // 计算出放大镜的位置
      switch (option.magPosition) {
        default:
        case 'relative-mouse':
          canvas.style.left = (evt.clientX + option.magPositionX) + 'px'
          canvas.style.right = ''
          canvas.style.top = (evt.clientY + option.magPositionY) + 'px'
          canvas.style.bottom = ''
          break
        case 'fixed':
          canvas.style.left = option.magPositionX + 'px'
          canvas.style.right = ''
          canvas.style.top = option.magPositionY + 'px'
          canvas.style.bottom = ''
          break
        case 'relative-src':
          canvas.style.left = (imgNode.x + option.magPositionX) + 'px'
          canvas.style.right = ''
          canvas.style.top = (imgNode.y + option.magPositionY) + 'px'
          canvas.style.bottom = ''
          break
      }
      // add 蒙版
      let masking
      if (!document.getElementById('__img_magnifier_masking__')) {
        masking = document.createElement('div')
        masking.id = '__img_magnifier_masking__'
        masking.style.position = 'fixed'
        masking.style.zIndex = '3998'
        // 白色半透明
        masking.style.backgroundColor = option.maskingColor
        masking.style.opacity = '' + option.maskingOpacity
        masking.style.display = 'block'
        // 阻止接受鼠标事件(IE11)
        masking.style.pointerEvents = 'none'
        // masking.onmousemove = evt => evt.preventDefault()
        // masking.onmouseout = evt => evt.preventDefault()
        // masking.onmouseover = evt => evt.preventDefault()
        // 蒙版挂载到body
        document.body.appendChild(masking)
      } else {
        masking = document.getElementById('__img_magnifier_masking__')
      }
      masking.style.top = evt.clientY + 'px'
      masking.style.left = evt.clientX + 'px'
      // 原图像 待放大 块大小
      const srcMagChunkPX = option.srcMagChunkSize / (image.naturalHeight / imgNode.offsetHeight)
      masking.style.width = srcMagChunkPX + 'px'
      masking.style.height = srcMagChunkPX + 'px'
      // transfer
      const syy = evt.offsetY * (image.naturalHeight / imgNode.offsetHeight)
      const sxx = evt.offsetX * (image.naturalWidth / imgNode.offsetWidth)
      ctx.drawImage(image, sxx, syy, option.srcMagChunkSize, option.srcMagChunkSize, 0, 0, option.magnifierSize, option.magnifierSize)
    }
    // mouse out of imgnode
    imgNode.onmouseout = evt => {
      evt.stopPropagation()
      // destory the magnifier
      try {
        option.mountNode.removeChild(document.getElementById('__magnifier__pic__'))
        document.body.removeChild(document.getElementById('__img_magnifier_masking__'))
      } catch (error) {
      }
    }
  }
}
