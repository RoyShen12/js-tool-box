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
