var $loadingPageContainer = $('.loading-page-container')
var currentChart = null
var currentData = null

var dataFrom = '1hago'
var path = window.location.pathname
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
    if('1hago'==dataFrom) {
      drawResponseTimeChartWith(currentData)
    }
    render('last-response', currentData)
    render('datasets', currentData)
    render('from', currentData)
    render('to', currentData)
    render('exception-rate', currentData)
    render('avg-loading-time', currentData)
    render('max-loading-time', currentData)
    render('min-loading-time', currentData)
    render('count-by-status-code', currentData)
    render('history', currentData)
    $loadingPageContainer.removeClass('loading-page-active')
  })
}

function render(type, data) {
  var counter = $('#'+type)
  if('last-response'==type) {
    counter.empty()
    var lastResponse = data[data.length-1]
    counter.append($('<p>Last status: '+renderStatusFrom(lastResponse)+'</p>'))
  }
  if('datasets'==type) {
    counter.empty()
    counter.append(counterFrom('# datasets', data.length))
  }
  if('from'==type) {
    if(data.length===0){
      counter.hide()
    } else {
      counter.show()
      var date = data.reduce((acc, val)=>acc<val.id?acc:new Date(val.id), new Date(data[0].id))
      counter.empty()
      counter.append('From: <span class="light">' + formatDate(date) +'</span>')
    }
  }
  if('to'==type) {
    if(data.length===0){
      counter.hide()
    } else {
      counter.show()
      var date = data.reduce((acc, val)=>acc>val.id?acc:new Date(val.id), null)
      counter.empty()
      counter.append('To: <span class="light">' + formatDate(date) +'</span>')
    }
  }
  if('exception-rate'==type) {
    if(data.length===0){
      counter.hide()
    } else {
      counter.show()
      var exceptionCount = data.reduce((acc, val)=>val.statusCode>=400 ? acc+1 : acc, 0)
      var exceptionRate = (exceptionCount/data.length).toFixed(5)
      counter.empty()
      counter.append(counterFrom('exception-rate', exceptionRate+'%'))
    }
  }
  if('avg-loading-time'==type) {
    if(data.length===0){
      counter.hide()
    } else {
      counter.show()
      var avg = _.meanBy(data, 'loadingTime')
      avg = parseInt(avg, 10)
      counter.empty()
      counter.append(counterFrom('avg loading time', avg+'ms'))
    }
  }
  if('max-loading-time'==type) {
    if(data.length===0){
      counter.hide()
    } else {
      counter.show()
      var max = _.maxBy(data, 'loadingTime').loadingTime
      max = parseInt(max, 10)
      counter.empty()
      counter.append(counterFrom('max loading time', max+'ms'))
    }
  }
  if('min-loading-time'==type) {
    if(data.length===0){
      counter.hide()
    } else {
      counter.show()
      var min = _.minBy(data, 'loadingTime').loadingTime
      min = parseInt(min, 10)
      counter.empty()
      counter.append(counterFrom('min loading time', min+'ms'))
    }
  }
  if('count-by-status-code'==type) {
    if(data.length===0){
      counter.hide()
    } else {
      counter.show()
      var countByStatusCode = _.countBy(data,'statusCode')
      var output = ""
      for(var key in countByStatusCode) {
        var value = countByStatusCode[key]
        output+='<strong>'+key+'</strong>:  '+value+'</br>'
      }
      counter.empty()
      counter.append(counterFrom('Count by `statusCode`', output))
    }
  }
  if('history'==type) {
    if(data.length===0){
      counter.hide()
    } else {
      counter.show()
      output = _.map(data, (d) => {
        return '<li class="pv2">'+ renderStatusWithTimestampFrom(d) +'</li>'
      }).join('')
      counter.empty()
      counter.append(output)
    }
  }
}

function renderStatusFrom(data) {
  var className = data.statusCode<400 ? 'green' : 'red'
  return '<span class="'+className+'">'+data.statusCode+' ('+data.loadingTime+')</span>'
}
function renderStatusWithTimestampFrom(data) {
  var className = data.statusCode<400 ? 'green' : 'red'
  return new Date(data.id).toUTCString() + '&nbsp;&nbsp; ' + renderStatusFrom(data)
}

function counterFrom(label, value) {
  return $('<div><p class="label">'+label+'</p><p class="value">'+value+'</p></div>')
}

function drawResponseTimeChartWith(data) {
  Chart.defaults.global.legend.display = false
  $("#loading-time-chart").empty()
  if(currentChart) {
    debugger
    currentChart.destroy()
  }
  var context = document.getElementById("loading-time-chart").getContext('2d');
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
        borderWidth: 3,
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
    return ''
  if(!date) {
  }
  return date.toTimeString().substring(0,8)
}

function formatDate(date) {
  if(!date) {
    return ''
  }
  return date.toUTCString()
  var isoString = date.toISOString()
  return isoString.substring(0,"2016-09-24".length)+ ' ' + isoString.substring("2016-09-24T".length, "2016-09-24T".length+8)
}
