const URL_BOOKS = 'data/books.json';
const URL_ROOMS = 'data/studyrooms.json';

const fetchJson = (url) =>
  fetch(url + '?t=' + Date.now() + Math.random()).then(r => {
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return r.json();
  });

const loadParallel = async () => {
  const [books, rooms] = await Promise.all([
    fetchJson(URL_BOOKS),
    fetchJson(URL_ROOMS)
  ]);
  return { books, rooms };
};

const loadSerial = async () => {
  const books = await fetchJson(URL_BOOKS);
  const rooms = await fetchJson(URL_ROOMS);
  return { books, rooms };
};

const renderData = ({ books, rooms }) => {
  $('#summary').html(`
    <div class="col-md-6">
      <div class="card text-bg-primary">
        <div class="card-body">
          <h2 class="h6">${books.title}</h2>
          <p class="mb-0">共 ${books.series.length} 个品类 / ${books.months.length} 个月</p>
        </div>
      </div>
    </div>
    <div class="col-md-6">
      <div class="card text-bg-success">
        <div class="card-body">
          <h2 class="h6">${rooms.title}</h2>
          <p class="mb-0">共 ${rooms.rooms.length} 个自习室 / ${rooms.months.length} 个月</p>
        </div>
      </div>
    </div>`);

  $('#book-list').html(books.series.map(s => {
    const total = s.counts.reduce((a, b) => a + b, 0);
    return `<li class="list-group-item d-flex justify-content-between">
      <span>${s.category}</span><strong>${total} 册</strong></li>`;
  }).join(''));

  $('#room-list').html(rooms.rooms.map(r => {
    const total = r.visits.reduce((a, b) => a + b, 0);
    return `<li class="list-group-item d-flex justify-content-between">
      <span>${r.room}</span><strong>${total} 人次</strong></li>`;
  }).join(''));
};

const init = async () => {
  $('#status').attr('class', 'alert alert-warning').text('两份数据并行加载中...').show();
  const t0 = performance.now();
  try {
    const result = await loadParallel();
    const cost = Math.round(performance.now() - t0);
    renderData(result);
    $('#status').attr('class', 'alert alert-success')
      .text(`全部加载完成（Promise.all 并行，耗时 ${cost} ms）`).show();
  } catch (error) {
    $('#status').attr('class', 'alert alert-danger')
      .text('至少一份数据加载失败：' + error.message).show();
  }
};

const benchmark = async (loader, rounds) => {
  const costs = [];
  for (let i = 0; i < rounds; i++) {
    const t0 = performance.now();
    await loader();
    costs.push(Math.round(performance.now() - t0));
  }
  const avg = Math.round(costs.reduce((a, b) => a + b, 0) / costs.length);
  return { costs, avg };
};

let cached = null;
const mockFetch = () => new Promise(resolve => {
  setTimeout(() => resolve(cached), 300);
});
const mockParallel = async () => { await Promise.all([mockFetch(), mockFetch()]); };
const mockSerial = async () => { await mockFetch(); await mockFetch(); };

const fillRow = (roundsSel, avgSel, result) => {
  $(roundsSel).text(result.costs.join('、'));
  $(avgSel).text(result.avg);
};
const conclusion = (parallelAvg, serialAvg) => {
  const faster = serialAvg - parallelAvg;
  const pct = serialAvg === 0 ? 0 : Math.round(faster / serialAvg * 100);
  if (faster <= 0) return '本地太快，差异在测量误差内';
  return `并行快约 ${faster} ms（省 ${pct}%）`;
};

$('#btn-real').on('click', async function () {
  $(this).prop('disabled', true).text('测量中...');
  cached = await loadParallel(); 
  const p = await benchmark(loadParallel, 5);
  const s = await benchmark(loadSerial, 5);
  fillRow('#real-parallel-rounds', '#real-parallel-avg', p);
  fillRow('#real-serial-rounds', '#real-serial-avg', s);
  $('#real-conclusion').text(conclusion(p.avg, s.avg) + '；本地localhost往返极小，差异可能不明显');
  $(this).prop('disabled', false).text('真实测量（本地，各5轮）');
});

$('#btn-mock').on('click', async function () {
  $(this).prop('disabled', true).text('模拟中...');
  if (cached === null) cached = await loadParallel();
  const p = await benchmark(mockParallel, 3);
  const s = await benchmark(mockSerial, 3);
  fillRow('#mock-parallel-rounds', '#mock-parallel-avg', p);
  fillRow('#mock-serial-rounds', '#mock-serial-avg', s);
  $('#mock-conclusion').text(conclusion(p.avg, s.avg) + '；原理：并行≈1个RTT，串行≈2个RTT');
  $(this).prop('disabled', false).text('模拟慢网络（每份延迟300ms）');
});

init();
