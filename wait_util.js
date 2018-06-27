// simple 'sleep' function
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
// testing
sleep(1000).then(r => console.log(r))
// result on console
// return --> Promise {<pending>}
// ......
// return --> undefined

// sleep_util_for on javascript
function sleep_util_for(util_exp_fx, itv_ms = 50) {
  return new Promise(resolve => {
    let transP = {intervalKey: null}
    const func = (tp, rsv) => {
      console.log('ivk')
      if (!!util_exp_fx()) {
        console.log('now resolve()->', rsv())
        clearInterval(tp.intervalKey)
      }
    }
    transP.intervalKey = setInterval(fx => { fx(transP, resolve) }, itv_ms, func)
  })
}
// accesseory function delacre a 'wait util for' condition as { util_exp_fx }
// wait util time goes for { time_ms } milliseconds
const fxx_util = (time_ms) => {
  let dt = new Date()
  return () => {
    return (new Date()).getTime() - dt.getTime() > time_ms
  }
}
// another accesseory function
// wait util map loaded
const fxx_util2 = (map) => map.loaded
// testing
sleep_util_for(fxx_util(10000), 200).then(() => console.log('ok'))
// testing async await
(async function () {
  console.log('start')
  await sleep_util_for(fxx_util(10000), 200)
  console.log('end')
}())
// testing for babled async await
function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }
_asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee() {
  return regeneratorRuntime.wrap(function _callee$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          console.log('start')
          _context.next = 3
          return sleep_util_for(fxx_util(10000), 200)

        case 3:
          console.log('end')

        case 4:
        case 'end':
          return _context.stop()
      }
    }
  }, _callee, this)
}))()
