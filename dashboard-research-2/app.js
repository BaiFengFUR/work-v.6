const COLORS = ['#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de', '#9a60b4'];

const state = { data: null, selectedIndex: -1 };

const loadData = async () => {
  $('#status').text('加载中...').show();
  try {
    const response = await fetch('data/books.json');
    if (!response.ok) throw new Error('HTTP ' + response.status);
    const data = await response.json();
    if (data.series.length === 0) {
      $('#status').text('暂无数据').show();
      return;
    }
    state.data = data;
    $('#status').hide();
    renderCards(data);
    renderBarChart(data);
    renderLineChart(data);
    bindLinkage(data);
  } catch (error) {
    $('#status').text('加载失败：' + error.message).show();
  }
};

const renderCards = (data) => {
  data.series.forEach(s => {
    const total = s.counts.reduce((sum, n) => sum + n, 0);
    $('#cards').append(`
      <div class="col-md-4">
        <div class="card"><div class="card-body">
          <h3 class="card-title h6">${s.category}</h3>
          <p class="card-text fs-4">${total}</p>
          <p class="card-text small text-muted">共${data.months.length}个月累计借阅（册）</p>
        </div></div>
      </div>`);
  });
};

let barChart = null;
const renderBarChart = (data) => {
  barChart = echarts.init(document.querySelector('#bar-chart'));
  barChart.setOption({
    title: { text: '各月各品类借阅量（单位：册）', left: 'center' },
    tooltip: { trigger: 'axis' },
    legend: { bottom: 0 },
    grid: { left: 50, right: 20, top: 60, bottom: 60 },
    xAxis: { data: data.months, axisLabel: { rotate: 30 } },
    yAxis: { name: '册' },
    series: data.series.map((s, i) => ({
      name: s.category,
      type: 'bar',
      data: s.counts,
      itemStyle: { color: COLORS[i] }
    }))
  });
};

let lineChart = null;
const renderLineChart = (data) => {
  lineChart = new Chart(document.querySelector('#line-chart'), {
    type: 'line',
    data: {
      labels: data.months,
      datasets: data.series.map((s, i) => ({
        label: s.category,
        data: s.counts,
        borderColor: COLORS[i],
        backgroundColor: COLORS[i],
        borderWidth: 1,
        pointRadius: 3,
        tension: 0.2
      }))
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: { display: true, text: '借阅趋势（单位：册，数据来源：课程统一数据集）' }
      },
      scales: { y: { beginAtZero: true } }
    }
  });
};

const highlightMonth = (index) => {
  const data = state.data;
  state.selectedIndex = index;

  lineChart.data.datasets.forEach((ds, di) => {
    ds.pointRadius = data.months.map((_, i) => (i === index ? 8 : 3));
    ds.pointBackgroundColor = data.months.map((_, i) => (i === index ? '#e60012' : COLORS[di]));
    ds.pointBorderColor = data.months.map((_, i) => (i === index ? '#e60012' : COLORS[di]));
  });
  lineChart.update();

  const detail = data.series.map(s => `${s.category} ${s.counts[index]} 册`).join('　');
  $('#pick-info').text(`已选中「${data.months[index]}」：${detail}（再次点击该月或点击空白处取消）`).show();
};

const resetHighlight = () => {
  if (state.selectedIndex === -1) return;
  state.selectedIndex = -1;
  lineChart.data.datasets.forEach((ds, di) => {
    ds.pointRadius = 3;
    ds.pointBackgroundColor = COLORS[di];
    ds.pointBorderColor = COLORS[di];
  });
  lineChart.update();
  $('#pick-info').hide();
};

const bindLinkage = (data) => {
  barChart.on('click', (params) => {
    if (params.componentType !== 'series') return;
    const index = params.dataIndex;
    state.selectedIndex === index ? resetHighlight() : highlightMonth(index);
  });
  
  barChart.getZr().on('click', (e) => {
    if (!e.target) resetHighlight();
  });

  window.addEventListener('resize', () => barChart.resize());
};

loadData();
