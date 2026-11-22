const DEFAULT_TIMEOUT_TOKEN_LIMIT = 1800;
const MAX_SEEN_IDS = 500;
const ALPHA = 0.6;
const USER_WEIGHT = 3.0;

export function foldVietnamese(text) {
  return String(text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function extractTextFeatures(text) {
  const clean = foldVietnamese(text);
  if (!clean) return [];

  const tokens = clean
    .split(/\s+/)
    .filter((token) => token.length >= 2 || /\d/.test(token));

  if (!tokens.length) return [];

  const features = [];
  let trigramCount = 0;

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (token.length >= 2) {
      features.push({ feature: `w:${token}`, weight: 1.0 });
    }
    if (i > 0) {
      const pair = `${tokens[i - 1]}_${token}`;
      features.push({ feature: `b:${pair}`, weight: 1.8 });
    }
    if (token.length >= 4 && trigramCount < 24) {
      for (let j = 0; j <= token.length - 3 && trigramCount < 24; j++) {
        features.push({ feature: `c:${token.slice(j, j + 3)}`, weight: 0.35 });
        trigramCount++;
      }
    }
  }

  return features;
}

export function extractAmountFeatures(amount) {
  const value = Number(amount);
  if (!Number.isFinite(value) || value <= 0) return [];
  if (value < 30000) return [{ feature: 'amt:micro', weight: 1.1 }];
  if (value < 120000) return [{ feature: 'amt:small', weight: 1.1 }];
  if (value < 500000) return [{ feature: 'amt:medium', weight: 1.1 }];
  if (value < 2000000) return [{ feature: 'amt:large', weight: 1.1 }];
  return [{ feature: 'amt:xlarge', weight: 1.1 }];
}

export function extractDueFeatures(hanChot, now = Date.now()) {
  if (!hanChot) return [];
  const raw = String(hanChot).trim();
  if (!raw) return [];

  let iso = raw;
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    iso = `${raw}T23:59:59+07:00`;
  } else if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(raw)) {
    iso = `${raw}:00+07:00`;
  }

  const dueMs = new Date(iso).getTime();
  if (!Number.isFinite(dueMs)) return [];

  const diffDays = Math.floor((dueMs - now) / 86400000);
  if (diffDays < 0) return [{ feature: 'due:overdue', weight: 1.6 }];
  if (diffDays <= 1) return [{ feature: 'due:urgent', weight: 1.5 }];
  if (diffDays <= 3) return [{ feature: 'due:soon', weight: 1.4 }];
  if (diffDays <= 7) return [{ feature: 'due:week', weight: 1.3 }];
  return [{ feature: 'due:later', weight: 1.4 }];
}

const SPECIAL_FEATURE_LABELS = {
  'amt:micro': 'mức chi rất nhỏ',
  'amt:small': 'mức chi nhỏ',
  'amt:medium': 'mức chi vừa',
  'amt:large': 'mức chi lớn',
  'amt:xlarge': 'mức chi rất lớn',
  'due:overdue': 'đã quá hạn',
  'due:urgent': 'hạn gấp <= 1 ngày',
  'due:soon': 'hạn 2-3 ngày',
  'due:week': 'hạn trong tuần',
  'due:later': 'hạn xa > 7 ngày',
};

export function formatFeatureLabel(feature) {
  if (!feature) return '';
  if (SPECIAL_FEATURE_LABELS[feature]) return SPECIAL_FEATURE_LABELS[feature];
  if (feature.startsWith('b:')) return feature.slice(2).replace(/_/g, ' ');
  if (feature.startsWith('w:')) return feature.slice(2);
  return '';
}

const SEED_TEXTS = {
  finance_chi: {
    an_uong: [
      { text: 'cơm tấm sườn bì ăn trưa', amount: 45000 },
      { text: 'bún bò huế phở bò ăn sáng', amount: 40000 },
      { text: 'trà sữa trân châu phúc long gong cha', amount: 55000 },
      { text: 'cà phê sữa đá highlands katinat cafe', amount: 39000 },
      { text: 'bánh mì xôi mặn nước suối căng tin', amount: 25000 },
      { text: 'ăn tối lẩu nướng gà rán pizza hamburger', amount: 110000 },
      { text: 'siêu thị winmart bách hóa xanh circle k gs25 đồ ăn vặt mì gói', amount: 85000 },
      { text: 'lunch dinner breakfast coffee milk tea snack grocery food', amount: 60000 },
      { text: 'đặt đồ ăn shopeefood grabfood baemin giao hàng cơm hộp', amount: 50000 },
    ],
    di_lai: [
      { text: 'đổ xăng xe máy petrolimex đầy bình', amount: 70000 },
      { text: 'đặt xe grab bike be gojek xanh sm đi học', amount: 35000 },
      { text: 'gửi xe tháng vé xe buýt bus card', amount: 20000 },
      { text: 'sửa xe thay nhớt vá lốp bảo dưỡng xe máy', amount: 150000 },
      { text: 'taxi sân bay vé tàu hỏa vé xe khách về quê', amount: 320000 },
      { text: 'nạp thẻ metro vé cầu đường gửi xe trường', amount: 15000 },
      { text: 'gasoline fuel uber grab ride parking ticket commute transport', amount: 50000 },
    ],
    tro: [
      { text: 'tiền phòng trọ tháng thuê nhà chung cư', amount: 2800000 },
      { text: 'tiền điện tiền nước sinh hoạt hóa đơn điện lực', amount: 420000 },
      { text: 'cước internet wifi tiền mạng vnpt viettel fpt', amount: 200000 },
      { text: 'đặt cọc phòng trọ tiền rác vệ sinh phí quản lý', amount: 2500000 },
      { text: 'mua bình nước uống gas nấu ăn đồ gia dụng phòng trọ', amount: 280000 },
      { text: 'rent apartment room electricity water internet utility bill', amount: 2200000 },
    ],
    hoc_phi: [
      { text: 'đóng học phí học kỳ đại học tín chỉ', amount: 8500000 },
      { text: 'mua sách giáo trình tài liệu photo in ấn đề cương', amount: 95000 },
      { text: 'lệ phí thi tiếng anh toeic ielts chứng chỉ tin học', amount: 1100000 },
      { text: 'khóa học online udemy coursera học thêm ngoại ngữ', amount: 450000 },
      { text: 'văn phòng phẩm bút vở máy tính bỏ túi dụng cụ học tập', amount: 80000 },
      { text: 'tuition fee university textbook exam registration stationery course', amount: 3500000 },
    ],
    giai_tri: [
      { text: 'mua vé xem phim rạp cgv lotte galaxy bắp nước', amount: 180000 },
      { text: 'đăng ký netflix spotify youtube premium giải trí', amount: 70000 },
      { text: 'chơi game nạp thẻ steam playstation net bi a karaoke', amount: 200000 },
      { text: 'du lịch dã ngoại vé vào cổng concert cafe cuối tuần', amount: 380000 },
      { text: 'tập gym cầu lông bơi lội vé sân thể thao', amount: 250000 },
      { text: 'movie cinema ticket gaming netflix music concert bowling travel', amount: 190000 },
    ],
    khac: [
      { text: 'mua thuốc tây khám bệnh nhà thuốc long châu pharmacity', amount: 120000 },
      { text: 'cắt tóc gội đầu làm đẹp mỹ phẩm sữa rửa mặt', amount: 140000 },
      { text: 'quà tặng sinh nhật bạn bè quyên góp từ thiện', amount: 200000 },
      { text: 'giặt ủi quần áo sửa điện thoại thay pin laptop', amount: 160000 },
      { text: 'medicine pharmacy clinic haircut laundry gift repair misc', amount: 150000 },
    ],
  },
  finance_thu: {
    luong: [
      { text: 'lương tháng làm thêm part time thực tập sinh internship', amount: 3500000 },
      { text: 'tiền dạy gia sư kèm học sinh freelance thiết kế code web', amount: 1200000 },
      { text: 'tiền công phục vụ quán cafe barista chạy giao hàng', amount: 900000 },
      { text: 'monthly salary paycheck part time wages freelance payment', amount: 4000000 },
    ],
    hoc_bong: [
      { text: 'học bổng khuyến khích học tập kỳ học bổng doanh nghiệp', amount: 6000000 },
      { text: 'nhận học bổng toàn phần hỗ trợ nghiên cứu khoa học', amount: 4500000 },
      { text: 'tiền tài trợ miễn giảm học phí sinh viên xuất sắc', amount: 2500000 },
      { text: 'scholarship academic grant fellowship tuition award', amount: 5000000 },
    ],
    tro_cap: [
      { text: 'ba mẹ gửi tiền sinh hoạt tháng trợ cấp gia đình', amount: 3000000 },
      { text: 'mẹ chuyển khoản tiền trọ bố cho tiền ăn uống', amount: 2000000 },
      { text: 'anh chị chu cấp tiền học hàng tháng', amount: 1500000 },
      { text: 'family allowance parents transfer monthly living support', amount: 2500000 },
    ],
    thuong: [
      { text: 'tiền thưởng đạt giải cuộc thi hackathon nckh', amount: 1500000 },
      { text: 'lì xì tết thưởng lễ hoa hồng hoàn tiền cashback', amount: 500000 },
      { text: 'bonus competition prize reward cashback gift money', amount: 800000 },
    ],
    khac: [
      { text: 'bán đồ cũ thanh lý sách giáo trình bạn trả nợ tiền', amount: 300000 },
      { text: 'hoàn cọc nhà trọ tiền lãi tiết kiệm ngân hàng', amount: 400000 },
      { text: 'refund payback loan returned selling used item interest', amount: 250000 },
    ],
  },
  deadline_priority: {
    cao: [
      { text: 'nộp đồ án tốt nghiệp báo cáo cuối kỳ bảo vệ khóa luận', dueFeature: 'due:urgent' },
      { text: 'ôn thi cuối kỳ thi giữa kỳ kiểm tra môn học gấp', dueFeature: 'due:urgent' },
      { text: 'nộp bài tiểu luận thuyết trình trước lớp hôm nay', dueFeature: 'due:urgent' },
      { text: 'đóng học phí hết hạn đăng ký tín chỉ môn học khẩn', dueFeature: 'due:overdue' },
      { text: 'nộp hồ sơ học bổng thực tập deadline gấp ngày mai', dueFeature: 'due:urgent' },
      { text: 'final exam midterm defense submit thesis urgent capstone project', dueFeature: 'due:urgent' },
      { text: 'bài kiểm tra hệ số cao bảo vệ đồ án môn', dueFeature: 'due:soon' },
    ],
    binh_thuong: [
      { text: 'làm bài tập về nhà tuần thực hành lab buổi học', dueFeature: 'due:week' },
      { text: 'soạn slide thuyết trình họp nhóm dự án định kỳ', dueFeature: 'due:soon' },
      { text: 'viết báo cáo thực hành chuẩn bị bài mới chương tiếp', dueFeature: 'due:week' },
      { text: 'tổng hợp đề cương ôn tập giữa kỳ câu hỏi thảo luận', dueFeature: 'due:week' },
      { text: 'weekly homework lab assignment group meeting prepare slides', dueFeature: 'due:week' },
      { text: 'hoàn thành bài tập lớn giai đoạn hai bình thường', dueFeature: 'due:soon' },
    ],
    thap: [
      { text: 'đọc thêm sách tham khảo tài liệu mở rộng tự học', dueFeature: 'due:later' },
      { text: 'sắp xếp lại thư mục ghi chú bài giảng sao lưu tài liệu', dueFeature: 'due:later' },
      { text: 'xem lại video bài giảng cũ tìm hiểu thêm công nghệ mới', dueFeature: 'due:later' },
      { text: 'tổng kết lịch học tháng sau lên ý tưởng cá nhân', dueFeature: 'due:later' },
      { text: 'optional reading organize notes backup archive watch recording later', dueFeature: 'due:later' },
    ],
  },
};

const TASKS = Object.keys(SEED_TEXTS);

function compileSeedCorpus() {
  const compiled = {};
  for (const task of TASKS) {
    const labels = {};
    const vocab = new Set();
    for (const [label, samples] of Object.entries(SEED_TEXTS[task])) {
      const tokenCounts = Object.create(null);
      let totalWeight = 0;
      for (const sample of samples) {
        const feats = [
          ...extractTextFeatures(sample.text),
          ...(sample.amount ? extractAmountFeatures(sample.amount) : []),
          ...(sample.dueFeature ? [{ feature: sample.dueFeature, weight: 1.8 }] : []),
        ];
        for (const { feature, weight } of feats) {
          tokenCounts[feature] = (tokenCounts[feature] || 0) + weight;
          totalWeight += weight;
          vocab.add(feature);
        }
      }
      labels[label] = {
        docCount: samples.length,
        tokenCounts,
        totalWeight,
      };
    }
    compiled[task] = { labels, vocab };
  }
  return compiled;
}

const COMPILED_SEED = compileSeedCorpus();

function emptyTaskState() {
  return {
    classDocCounts: {},
    tokenCounts: {},
    classTokenTotals: {},
    userSamples: 0,
    feedbackHits: 0,
    feedbackTotal: 0,
    seenIds: [],
  };
}

function sanitizeTaskState(raw) {
  const base = emptyTaskState();
  if (!raw || typeof raw !== 'object') return base;
  if (raw.classDocCounts && typeof raw.classDocCounts === 'object') {
    for (const [k, v] of Object.entries(raw.classDocCounts)) {
      if (Number.isFinite(v) && v > 0) base.classDocCounts[k] = v;
    }
  }
  if (raw.tokenCounts && typeof raw.tokenCounts === 'object') {
    for (const [label, map] of Object.entries(raw.tokenCounts)) {
      if (!map || typeof map !== 'object') continue;
      const cleanMap = {};
      for (const [feat, val] of Object.entries(map)) {
        if (Number.isFinite(val) && val > 0) cleanMap[feat] = val;
      }
      if (Object.keys(cleanMap).length) base.tokenCounts[label] = cleanMap;
    }
  }
  if (raw.classTokenTotals && typeof raw.classTokenTotals === 'object') {
    for (const [k, v] of Object.entries(raw.classTokenTotals)) {
      if (Number.isFinite(v) && v > 0) base.classTokenTotals[k] = v;
    }
  }
  base.userSamples = Number.isFinite(raw.userSamples) && raw.userSamples >= 0 ? Math.floor(raw.userSamples) : 0;
  base.feedbackHits = Number.isFinite(raw.feedbackHits) && raw.feedbackHits >= 0 ? Math.floor(raw.feedbackHits) : 0;
  base.feedbackTotal = Number.isFinite(raw.feedbackTotal) && raw.feedbackTotal >= 0 ? Math.floor(raw.feedbackTotal) : 0;
  base.seenIds = Array.isArray(raw.seenIds)
    ? raw.seenIds.filter((id) => typeof id === 'string').slice(-MAX_SEEN_IDS)
    : [];
  return base;
}

function pruneVocabulary(taskState) {
  const globalTotals = new Map();
  for (const map of Object.values(taskState.tokenCounts)) {
    for (const [feat, count] of Object.entries(map)) {
      globalTotals.set(feat, (globalTotals.get(feat) || 0) + count);
    }
  }
  if (globalTotals.size <= DEFAULT_TIMEOUT_TOKEN_LIMIT) return;

  const sorted = [...globalTotals.entries()].sort((a, b) => a[1] - b[1]);
  const dropCount = globalTotals.size - Math.floor(DEFAULT_TIMEOUT_TOKEN_LIMIT * 0.85);
  const toDrop = new Set(sorted.slice(0, dropCount).map(([feat]) => feat));

  for (const [label, map] of Object.entries(taskState.tokenCounts)) {
    let removedWeight = 0;
    for (const feat of Object.keys(map)) {
      if (toDrop.has(feat)) {
        removedWeight += map[feat];
        delete map[feat];
      }
    }
    if (removedWeight > 0) {
      taskState.classTokenTotals[label] = Math.max(0, (taskState.classTokenTotals[label] || 0) - removedWeight);
    }
  }
}

function nowMs() {
  return typeof performance !== 'undefined' && typeof performance.now === 'function'
    ? performance.now()
    : Date.now();
}

export function createEdgeModel(savedState = null) {
  const tasks = {};
  for (const task of TASKS) {
    tasks[task] = sanitizeTaskState(savedState?.tasks?.[task]);
  }

  function train(task, label, features, options = {}) {
    if (!TASKS.includes(task)) return false;
    const cleanLabel = String(label || '').trim();
    if (!cleanLabel || !Array.isArray(features) || features.length === 0) return false;

    const { weight = 1, sampleId = null, wasPredictedLabel = null } = options;
    const w = Number.isFinite(weight) && weight > 0 ? weight : 1;
    const taskState = tasks[task];

    if (sampleId !== null && sampleId !== undefined && sampleId !== '') {
      const idStr = String(sampleId);
      if (taskState.seenIds.includes(idStr)) return false;
      taskState.seenIds.push(idStr);
      if (taskState.seenIds.length > MAX_SEEN_IDS) {
        taskState.seenIds = taskState.seenIds.slice(-MAX_SEEN_IDS);
      }
    }

    taskState.classDocCounts[cleanLabel] = (taskState.classDocCounts[cleanLabel] || 0) + w;
    if (!taskState.tokenCounts[cleanLabel]) taskState.tokenCounts[cleanLabel] = {};

    let addedTotal = 0;
    for (const item of features) {
      if (!item?.feature) continue;
      const fw = (Number.isFinite(item.weight) && item.weight > 0 ? item.weight : 1) * w;
      taskState.tokenCounts[cleanLabel][item.feature] = (taskState.tokenCounts[cleanLabel][item.feature] || 0) + fw;
      addedTotal += fw;
    }

    if (addedTotal === 0) return false;

    taskState.classTokenTotals[cleanLabel] = (taskState.classTokenTotals[cleanLabel] || 0) + addedTotal;
    taskState.userSamples += 1;

    if (wasPredictedLabel && String(wasPredictedLabel).trim()) {
      taskState.feedbackTotal += 1;
      if (String(wasPredictedLabel).trim() === cleanLabel) {
        taskState.feedbackHits += 1;
      }
    }

    pruneVocabulary(taskState);
    return true;
  }

  function predict(task, features, options = {}) {
    if (!TASKS.includes(task)) return null;
    if (!Array.isArray(features) || features.length === 0) return null;

    const start = nowMs();
    const { allowedLabels = null, labelDisplayNames = null } = options;
    const seed = COMPILED_SEED[task];
    const taskState = tasks[task];

    let candidates;
    if (Array.isArray(allowedLabels) && allowedLabels.length > 0) {
      candidates = [...new Set(allowedLabels.map((l) => String(l || '').trim()).filter(Boolean))];
    } else {
      const set = new Set([...Object.keys(seed.labels), ...Object.keys(taskState.classDocCounts)]);
      candidates = [...set];
    }

    if (!candidates.length) return null;

    const vocab = new Set(seed.vocab);
    for (const map of Object.values(taskState.tokenCounts)) {
      for (const feat of Object.keys(map)) vocab.add(feat);
    }
    const vocabSize = Math.max(10, vocab.size);

    let totalDocs = 0;
    const docCounts = {};
    for (const label of candidates) {
      const baseDocs = seed.labels[label]?.docCount || 0;
      const userDocs = taskState.classDocCounts[label] || 0;
      const effective = Math.max(0.35, baseDocs + USER_WEIGHT * userDocs);
      docCounts[label] = effective;
      totalDocs += effective;
    }

    const inputWordSet = new Set(
      features
        .filter((f) => f?.feature && (f.feature.startsWith('w:') || f.feature.startsWith('b:')))
        .map((f) => f.feature),
    );

    const logScores = {};
    const perClassFeatureLL = {};

    for (const label of candidates) {
      const seedEntry = seed.labels[label];
      const baseTotal = seedEntry?.totalWeight || 0;
      const userTotal = taskState.classTokenTotals[label] || 0;
      const denom = baseTotal + USER_WEIGHT * userTotal + ALPHA * vocabSize;
      const userTokenMap = taskState.tokenCounts[label] || {};

      let score = Math.log(docCounts[label] / totalDocs);
      const featLL = {};

      for (const { feature, weight } of features) {
        if (!feature) continue;
        const fw = Number.isFinite(weight) && weight > 0 ? weight : 1;
        const baseCount = seedEntry?.tokenCounts?.[feature] || 0;
        const userCount = userTokenMap[feature] || 0;
        const ll = fw * Math.log((baseCount + USER_WEIGHT * userCount + ALPHA) / denom);
        score += ll;
        featLL[feature] = (featLL[feature] || 0) + ll;
      }

      // Zero-shot lexical alignment for user-created custom categories before first save.
      const displayName = labelDisplayNames?.[label];
      if (displayName && inputWordSet.size > 0) {
        const nameFeatures = extractTextFeatures(displayName).filter(
          (f) => f.feature.startsWith('w:') || f.feature.startsWith('b:'),
        );
        let boost = 0;
        const isCustom = !seedEntry;
        for (const nf of nameFeatures) {
          if (inputWordSet.has(nf.feature)) {
            boost += isCustom ? 1.5 : 0.35;
          }
        }
        if (boost > 0) {
          score += Math.min(isCustom ? 3.2 : 0.7, boost);
        }
      }

      logScores[label] = score;
      perClassFeatureLL[label] = featLL;
    }

    const maxLog = Math.max(...candidates.map((l) => logScores[l]));
    let sumExp = 0;
    const rawExp = {};
    for (const label of candidates) {
      const e = Math.exp(logScores[label] - maxLog);
      rawExp[label] = e;
      sumExp += e;
    }

    const scores = candidates
      .map((label) => ({
        label,
        probability: sumExp > 0 ? rawExp[label] / sumExp : 1 / candidates.length,
      }))
      .sort((a, b) => b.probability - a.probability);

    const winner = scores[0];
    const runnerUp = scores[1] || null;

    const topFeatures = [];
    const seenReadable = new Set();
    const winnerLL = perClassFeatureLL[winner.label] || {};
    const runnerLL = runnerUp ? perClassFeatureLL[runnerUp.label] || {} : {};

    const rankedFeatures = Object.keys(winnerLL)
      .filter((feat) => !feat.startsWith('c:'))
      .map((feat) => ({
        feat,
        advantage: winnerLL[feat] - (runnerLL[feat] || 0),
        readable: formatFeatureLabel(feat),
      }))
      .filter((item) => item.readable && item.advantage > 0.05)
      .sort((a, b) => b.advantage - a.advantage);

    for (const item of rankedFeatures) {
      if (!seenReadable.has(item.readable)) {
        seenReadable.add(item.readable);
        topFeatures.push(item.readable);
        if (topFeatures.length >= 3) break;
      }
    }

    const userTrainedForWinner = (taskState.classDocCounts[winner.label] || 0) > 0;
    const latencyMs = Math.max(0.1, Number((nowMs() - start).toFixed(2)));

    return {
      label: winner.label,
      confidence: Number(winner.probability.toFixed(4)),
      scores: scores.slice(0, 3).map((s) => ({
        label: s.label,
        probability: Number(s.probability.toFixed(4)),
      })),
      topFeatures,
      latencyMs,
      source: userTrainedForWinner ? 'personalized' : 'pretrained',
      trainedSamples: taskState.userSamples,
    };
  }

  function getStats() {
    const finChi = tasks.finance_chi;
    const finThu = tasks.finance_thu;
    const dl = tasks.deadline_priority;
    const vocab = new Set();

    for (const task of TASKS) {
      for (const map of Object.values(tasks[task].tokenCounts)) {
        for (const feat of Object.keys(map)) vocab.add(feat);
      }
    }

    const feedbackHits = finChi.feedbackHits + finThu.feedbackHits + dl.feedbackHits;
    const feedbackTotal = finChi.feedbackTotal + finThu.feedbackTotal + dl.feedbackTotal;
    const financeSamples = finChi.userSamples + finThu.userSamples;
    const deadlineSamples = dl.userSamples;

    return {
      financeSamples,
      deadlineSamples,
      totalSamples: financeSamples + deadlineSamples,
      vocabSize: vocab.size,
      feedbackHits,
      feedbackTotal,
      accuracyPct: feedbackTotal > 0 ? Math.round((feedbackHits / feedbackTotal) * 100) : null,
    };
  }

  function reset(task = null) {
    if (task && TASKS.includes(task)) {
      tasks[task] = emptyTaskState();
      return;
    }
    for (const name of TASKS) {
      tasks[name] = emptyTaskState();
    }
  }

  function serialize(userId = null) {
    return {
      version: 1,
      userId,
      updatedAt: Date.now(),
      tasks,
    };
  }

  return {
    train,
    predict,
    getStats,
    reset,
    serialize,
  };
}
