/* eslint-disable */
/**
 * 缓动函数和动画函数
 * @author shenwenxiao
 */
export default {
  /**
   * from jQuery Easing v1.4.1 - http://gsgd.co.uk/sandbox/jquery/easing/
   * 弹性缓动函数
   * @param {Number} x - 当前进度 0~1
   */
  bounceOut(x) {
    const n1 = 7.5625,
      d1 = 2.75
    if (x < 1 / d1) {
      return n1 * x * x
    } else if (x < 2 / d1) {
      return n1 * (x -= (1.5 / d1)) * x + .75
    } else if (x < 2.5 / d1) {
      return n1 * (x -= (2.25 / d1)) * x + .9375
    } else {
      return n1 * (x -= (2.625 / d1)) * x + .984375
    }
  },
  /**
   * from jQuery Easing v1.4.1 - http://gsgd.co.uk/sandbox/jquery/easing/
   * 弹性越界缓动函数
   * @param {Number} x - 当前进度 0~1
   */
  easeOutElastic(x) {
    const c4 = (2 * Math.PI) / 3
    return x === 0 ? 0 : x === 1 ? 1 :
      Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * c4) + 1
  },
  /**
   * from jQuery Easing v1.4.1 - http://gsgd.co.uk/sandbox/jquery/easing/
   * 骤减速运动函数
   * @param {Number} x - 当前进度 0~1
   */
  easeOutExpo(x) {
    return x === 1 ? 1 : 1 - Math.pow(2, -10 * x)
  },
  /**
   * from jQuery Easing v1.4.1 - http://gsgd.co.uk/sandbox/jquery/easing/
   * 骤加速运动函数
   * @param {Number} x - 当前进度 0~1
   */
  easeInExpo(x) {
		return x === 0 ? 0 : Math.pow( 2, 10 * x - 10 )
	},
  /**
   * 动画执行函数
   * @param {Number} startValue - 起始值
   * @param {Number} endValue - 终末值
   * @param {Number} duration - 动画持续时间
   * @param {Callback} easingFunc - 缓动函数
   * @param {Callback} stepCb - 单步执行回调函数，接受一个参数 {value}，表示动画过程中当前步的值大小
   */
  tween(startValue, endValue, duration, easingFunc, stepCb) {
    const updateTime = 1000 / 60
    const rAF = window.requestAnimationFrame || function (cb) {
      setTimeout(cb, updateTime)
    }

    const changeValue = endValue - startValue
    const updateCount = duration / updateTime
    const perUpdateDistance = 1 / updateCount
    let position = 0

    return new Promise(resolve => {
      function step(DOMStamp) {
        const state = startValue + changeValue * easingFunc(position)
        stepCb(state)
        position += perUpdateDistance
        if (position < 1) {
          rAF(step)
        } else {
          resolve()
        }
      }
      step()
    })
  }
}
