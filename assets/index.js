const $loadingPageContainer = $('.loading-page-container')
let currentChart = null
let currentData = null

let dataFrom = '1hago'
const path = window.location.pathname
if('/past/hour'==path){dataFrom = '1hago'}
if('/past/day'==path){dataFrom = '1dago'}
if('/past/week'==path){dataFrom = '1wago'}

requestDataFrom(dataFrom)

setTimeout(() => {
  window.location = window.location
}, 1000*60)

function requestDataFrom(from) {
  $.get('/statuses?from='+from, function(err, status, response){
    currentData = response.responseJSON.sort((a,b)=>a.id-b.id)
    drawResponseTimeChartWith(currentData)
    setCounter('datasets', currentData)
    setCounter('from', currentData)
    setCounter('to', currentData)
    setCounter('exception-rate', currentData)
    setCounter('avg-loading-time', currentData)
    setCounter('max-loading-time', currentData)
    setCounter('min-loading-time', currentData)
    setCounter('count-by-status-code', currentData)
    $loadingPageContainer.removeClass('loading-page-active')
  })
}

function setCounter(type, data) {
  const counter = $('#'+type)
  if('datasets'==type) {
    counter.empty()
    counter.append(counterFrom('# datasets', data.length))
  }
  if('from'==type) {
    if(data.length===0){
      counter.hide()
    } else {
      counter.show()
      const date = data.reduce((acc, val)=>acc<val.id?acc:new Date(val.id), new Date(data[0].id))
      counter.empty()
      counter.append(counterFrom('from', formatDate(date)))
    }
  }
  if('to'==type) {
    if(data.length===0){
      counter.hide()
    } else {
      counter.show()
      const date = data.reduce((acc, val)=>acc>val.id?acc:new Date(val.id), null)
      counter.empty()
      counter.append(counterFrom('to', formatDate(date)))
    }
  }
  if('exception-rate'==type) {
    if(data.length===0){
      counter.hide()
    } else {
      counter.show()
      const exceptionCount = data.reduce((acc, val)=>val.statusCode>=400 ? acc+1 : acc, 0)
      const exceptionRate = (exceptionCount/data.length).toFixed(5)
      counter.empty()
      counter.append(counterFrom('exception-rate', exceptionRate+'%'))
    }
  }
  if('avg-loading-time'==type) {
    if(data.length===0){
      counter.hide()
    } else {
      counter.show()
      let avg = _.meanBy(data, 'loadingTime')
      avg = avg.toFixed(1)
      counter.empty()
      counter.append(counterFrom('avg loading time', avg+'ms'))
    }
  }
  if('max-loading-time'==type) {
    if(data.length===0){
      counter.hide()
    } else {
      counter.show()
      let max = _.maxBy(data, 'loadingTime').loadingTime
      max = max.toFixed(1)
      counter.empty()
      counter.append(counterFrom('max loading time', max+'ms'))
    }
  }
  if('min-loading-time'==type) {
    if(data.length===0){
      counter.hide()
    } else {
      counter.show()
      let min = _.minBy(data, 'loadingTime').loadingTime
      min = min.toFixed(1)
      counter.empty()
      counter.append(counterFrom('min loading time', min+'ms'))
    }
  }
  if('count-by-status-code'==type) {
    if(data.length===0){
      counter.hide()
    } else {
      counter.show()
      const countByStatusCode = _.countBy(data,'statusCode')
      let output = ""
      for(let key in countByStatusCode) {
        const value = countByStatusCode[key]
        output+='<strong>'+key+'</strong>:  '+value+'</br>'
      }
      counter.empty()
      counter.append(counterFrom('Count by `statusCode`', output))
    }
  }
}

function counterFrom(label, value) {
  return $('<div><p class="label">'+label+'</p><p class="value">'+value+'</p></div>')
}

function drawResponseTimeChartWith(data) {
  $("#loading-time-chart").empty()
  if(currentChart) {
    debugger
    currentChart.destroy()
  }
  const context = document.getElementById("loading-time-chart").getContext('2d');
  currentChart = new Chart(context, {
    type: 'line',
    data: {
      labels: labelsFrom(data),
      datasets: [{
        label: "Response time (ms)",
        labelColor: /theme=dark/.test(window.location.search) ? "rgba(255,255,255,0.66)" : "rgba(33,33,33,0.66)",
        fill: false,
        steppedLine: /steppedLine=true/.test(window.location.search),
        lineTension: 0,
        borderColor: /theme=dark/.test(window.location.search) ? "rgba(255,255,255,0.66)" : "rgba(33,33,33,0.66)",
        borderWidth: 1,
        pointBorderWidth: 0,
        pointRadius: 1,
        pointHoverRadius: 3,
        pointHitRadius: 3,
        data: valuesFrom(data),
      }]
    }
  });
}


function labelsFrom(data) {
  data = data || []
  return data.map((a, index) => {
    if(index % parseInt((data.length)*0.33, 0)==0 || index == data.length-1){
      return formatTime(new Date(a.id))
    }
    return ""
  })
}

function valuesFrom(data) {
  data = data || []
  return data.map(a => a.loadingTime)
}

function formatTime(date){
  if(!date) {
    return ''
  }
  return date.toTimeString().substring(0,8)
}

function formatDate(date) {
  if(!date) {
    return ''
  }
  return date.toISOString()
}
