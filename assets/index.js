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
    currentData = response.responseJSON.sort((a,b)=>a.id>b.id)
    drawResponseTimeChartWith(currentData)
    setCounter('datasets', currentData)
    setCounter('from', currentData)
    setCounter('to', currentData)
    setCounter('exception-rate', currentData)
    setCounter('avg-loading-time', currentData)
    setCounter('count-by-status-code', currentData)
    $loadingPageContainer.removeClass('loading-page-active')
  })
}

function setCounter(type, data) {
  const counter = $('#'+type)
  if('datasets'==type) {
    counter.empty()
    counter.append($('<div><p class="label"># datasets</p><p class="value">'+data.length+'</p></div>'))
  }
  if('from'==type) {
    if(data.length===0){
      counter.hide()
    } else {
      counter.show()
    }
    const date = data.reduce((acc, val)=>acc<val.id?acc:new Date(val.id), new Date(data[0].id))
    console.log('-- date', date)
    counter.empty()
    counter.append($('<div><p class="label">from</p><p class="value">'+ formatDate(date)+'</p></div>'))
  }
  if('to'==type) {
    if(data.length===0){
      counter.hide()
    } else {
      counter.show()
    }
    const date = data.reduce((acc, val)=>acc>val.id?acc:new Date(val.id), null)
    counter.empty()
    counter.append($('<div><p class="label">to</p><p class="value">'+ formatDate(date)+'</p></div>'))
  }
  if('exception-rate'==type) {
    const exceptionCount = data.reduce((acc, val)=>val.statusCode>=400 ? acc+1 : acc, 0)
    const exceptionRate = (exceptionCount/data.length).toFixed(5)
    counter.empty()
    counter.append($('<div><p class="label">exception-rate</p><p class="value">'+ exceptionRate+'%</p></div>'))
  }
  if('avg-loading-time'==type) {
    let avg = data.reduce((acc, val)=>acc+val.loadingTime, 0)/data.length
    avg = avg.toFixed(1)
    counter.empty()
    counter.append($('<div><p class="label">avg loading time</p><p class="value">'+ avg+'ms</p></div>'))
  }
  if('count-by-status-code'==type) {
    const countByStatusCode = _.countBy(data,'statusCode')
    let output = ""
    for(let key in countByStatusCode) {
      const value = countByStatusCode[key]
      output+='<strong>'+key+'</strong>:  '+value+'</br>'
    }
    counter.empty()
    counter.append($('<div><p class="label">Count by `statusCode`</p><p class="value">'+output+'</p></div>'))
  }
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
        lineTension: 0.05,
        borderColor: /theme=dark/.test(window.location.search) ? "rgba(255,255,255,0.66)" : "rgba(33,33,33,0.66)",
        borderWidth: 1,
        data: valuesFrom(data),
      }]
    }
  });
}


function labelsFrom(data) {
  data = data || []
  return data.map((a, index) => {
    console.log('-- ', parseInt(data.length*0.33,0))
    if(index % parseInt((1+data.length)*0.33, 0)==0 || index == data.length-1){
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
