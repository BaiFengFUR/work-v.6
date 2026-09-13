// 阶段3：图表一——ECharts 分组柱状图（比较各月各品类借阅量）
const state = { data: null };

const loadData = async () => {
  $('#status').text('加载中...').show();
  try {
    const response = await fetch('data/books.json');
    if (!response.ok) {
      throw new Error('HTTP ' + response.status);
    }
    const data = await response.json();
    if (data.series.length === 0) {
      $('#status').text('暂无数据').show();
      return;
    }
    state.data = data;
    $('#sub-title').text(data.title + '（' + data.period + '） · 数据来源：' + data.source);
    $('#status').hide();
    renderCards(data);
    renderBarChart(data);
  } catch (error) {
    $('#status').text('加载失败：' + error.message).show();
  }
};

const renderCards = (data) => {
  const months = data.months;
  data.series.forEach(s => {
    const total = s.counts.reduce((sum, n) => sum + n, 0);
    $('#cards').append(`
      <div class="col-md-4">
        <div class="card">
          <div class="card-body">
            <h3 class="card-title h6">${s.category}</h3>
            <p class="card-text fs-4">${total}</p>
            <p class="card-text small text-muted">共${months.length}个月累计借阅（册）</p>
          </div>
        </div>
      </div>
    `);
  });
};

let barChart = null;
const renderBarChart = (data) => {
  if (barChart === null) {
    barChart = echarts.init(document.querySelector('#bar-chart'));
  }
  barChart.setOption({
    title: { text: '各月各品类借阅量（单位：册）', left: 'center' },
    tooltip: { trigger: 'axis' },
    legend: { bottom: 0 },
    grid: { left: 50, right: 20, top: 60, bottom: 60 },
    xAxis: {
      data: data.months,
      axisLabel: { rotate: 30 }
    },
    yAxis: { name: '册' },
    series: data.series.map(s => ({
      name: s.category,
      type: 'bar',
      data: s.counts
    }))
  });
};

loadData();
