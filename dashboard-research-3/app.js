const ANALYSIS = '真实案例：2026年美国白宫在X上发表图文,配文"美国钢铁回来了".从柱状图高度可以看到2025年美国钢铁的产量比起2024年,以及翻了一倍还多.但如果看柱状图的起点,会发现并不是从0开始的,而是从80开始,实际上是从80.8多到81.8多,整体涨幅只有1%多,远没有在画面上看那样暴涨数倍,柱状图是用柱的全长编码数值的，截去零点后，柱长之比不再等于数值之比，柱长比较必然被误导。所以我们必须注意柱状图纵轴必须从0开始，观察单位、时间范围与数据来源。';

const loadData = async () => {
  $('#status').text('加载中...').show();
  try {
    const response = await fetch('data/books.json');
    if (!response.ok) throw new Error('HTTP ' + response.status);
    const data = await response.json();
    if (!data.series.length) {
      $('#status').text('暂无数据').show();
      return;
    }
    $('#status').hide();
    $('#analysis').text(ANALYSIS);
    renderCharts(data);
  } catch (error) {
    $('#status').text('加载失败：' + error.message).show();
  }
};

const renderCharts = (data) => {
  const literature = data.series.find(s => s.category === '文学');
  const sourceText = data.period + ' · ' + data.source;

  const baseOption = (yMin, color) => ({
    title: {
      text: '文学类各月借阅量（单位：册）',
      subtext: sourceText,
      left: 'center',
      textStyle: { fontSize: 14 }
    },
    tooltip: { trigger: 'axis', valueFormatter: v => v + ' 册' },
    grid: { left: 55, right: 20, top: 70, bottom: 50 },
    xAxis: { type: 'category', data: data.months, axisLabel: { rotate: 30 } },
    yAxis: { type: 'value', name: '册', min: yMin },
    series: [{
      name: '文学类',
      type: 'bar',
      data: literature.counts,
      itemStyle: { color: color },
      label: { show: true, position: 'top', fontSize: 10 }
    }]
  });

  // 误导版：纵轴截断在 200，夸大差异
  const badChart = echarts.init(document.querySelector('#bad-chart'));
  badChart.setOption(baseOption(200, '#dc3545'));

  // 诚实版：纵轴从 0 开始
  const goodChart = echarts.init(document.querySelector('#good-chart'));
  goodChart.setOption(baseOption(0, '#198754'));

  window.addEventListener('resize', () => {
    badChart.resize();
    goodChart.resize();
  });
};

loadData();
