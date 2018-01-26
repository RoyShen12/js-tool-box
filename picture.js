/* eslint-disable */
/**
 * 上传图片，预览，base64编码和删除工具
 * @author shenwenxiao
 */
import tween from './tween'
import config from '@cfg'

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
            if (paramContainer[imageProName] instanceof Array) {
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
      }
    }
  },
  /**
   * 图片元素放大，必须有max-height,max-width属性和data-full（默认'false'）属性
   * @param {HTMLElement} imgNode - <img>标签的引用
   */
  previewFullScreen(imgNode) {
    // 获取保留高度
    const topBarH = config.topBarHeight + 4
    // 注入初始大小
    imgNode.dataset.oriHeight === undefined ? imgNode.dataset.oriHeight = imgNode.style.maxHeight : void(0)
    imgNode.dataset.oriWidth === undefined ? imgNode.dataset.oriWidth = imgNode.style.maxWidth : void(0)
    if (imgNode.dataset.full === 'false') {
      // 蒙版
      const masking = document.createElement('div')
      masking.id = 'img_full_masking'
      masking.style.display = 'block'
      masking.style.position = 'fixed'
      masking.style.top = topBarH + 'px'
      masking.style.bottom = masking.style.left = masking.style.right = '0px'
      masking.style.zIndex = '1998'
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
      full_node.style.zIndex = '1999'
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
  }
}
