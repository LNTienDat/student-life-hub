import test from 'node:test';
import assert from 'node:assert/strict';
import {
  edgeStorageKey,
  getEdgeAiStats,
  predictDeadlinePriority,
  predictFinanceCategory,
  resetEdgeAiModel,
  syncDeadlineHistory,
  syncFinanceHistory,
  trainDeadlineSample,
  trainFinanceSample,
} from '../src/services/edgeAiService.js';

function createMemoryStorage() {
  const map = new Map();
  return {
    getItem(key) {
      return map.has(key) ? map.get(key) : null;
    },
    setItem(key, value) {
      map.set(key, String(value));
    },
    removeItem(key) {
      map.delete(key);
    },
  };
}

test('pretrained EdgeAI classifies Vietnamese and English expenses and incomes accurately', () => {
  const storage = createMemoryStorage();

  const lunch = predictFinanceCategory({ userId: 1, text: 'Cơm tấm sườn ăn trưa', amount: 45000, loai: 'chi', storage });
  assert.equal(lunch.label, 'an_uong');
  assert.equal(lunch.source, 'pretrained');
  assert.ok(lunch.confidence > 0.42);
  assert.ok(lunch.latencyMs > 0);
  assert.ok(lunch.topFeatures.length >= 1);

  const ride = predictFinanceCategory({ userId: 1, text: 'Đổ xăng xe máy và grab đi học', amount: 70000, loai: 'chi', storage });
  assert.equal(ride.label, 'di_lai');

  const rent = predictFinanceCategory({ userId: 1, text: 'Tiền phòng trọ và tiền điện nước tháng 11', amount: 3100000, loai: 'chi', storage });
  assert.equal(rent.label, 'tro');

  const tuition = predictFinanceCategory({ userId: 1, text: 'Đóng học phí học kỳ đại học và lệ phí thi TOEIC', amount: 6500000, loai: 'chi', storage });
  assert.equal(tuition.label, 'hoc_phi');

  const salary = predictFinanceCategory({ userId: 1, text: 'Lương part time thực tập sinh tháng này', amount: 4000000, loai: 'thu', storage });
  assert.equal(salary.label, 'luong');

  const scholarship = predictFinanceCategory({ userId: 1, text: 'Nhận học bổng khuyến khích học tập', amount: 6000000, loai: 'thu', storage });
  assert.equal(scholarship.label, 'hoc_bong');
});

test('pretrained EdgeAI combines task title and due date for deadline priority', () => {
  const storage = createMemoryStorage();
  const now = new Date('2026-11-22T09:00:00+07:00').getTime();

  const urgent = predictDeadlinePriority({
    userId: 1,
    title: 'Nộp đồ án tốt nghiệp và ôn thi cuối kỳ',
    hanChot: '2026-11-23',
    now,
    storage,
  });
  assert.equal(urgent.label, 'cao');
  assert.ok(urgent.confidence > 0.5);

  const normal = predictDeadlinePriority({
    userId: 1,
    title: 'Làm bài tập về nhà lab thực hành tuần',
    hanChot: '2026-11-27',
    now,
    storage,
  });
  assert.equal(normal.label, 'binh_thuong');

  const low = predictDeadlinePriority({
    userId: 1,
    title: 'Đọc thêm sách tham khảo và sắp xếp thư mục ghi chú',
    hanChot: '2026-12-15',
    now,
    storage,
  });
  assert.equal(low.label, 'thap');
});

test('EdgeAI performs incremental online learning for custom categories and user overrides', () => {
  const storage = createMemoryStorage();
  const categories = [
    { ma: 'an_uong', ten: 'Ăn uống', loai: 'chi', daAn: false },
    { ma: 'giai_tri', ten: 'Giải trí', loai: 'chi', daAn: false },
    { ma: 'khac', ten: 'Khác', loai: 'chi', daAn: false },
    { ma: 'thu_cung', ten: 'Thú cưng', loai: 'chi', daAn: false },
  ];

  // Zero-shot + custom training on user-created category "Thú cưng"
  assert.equal(trainFinanceSample({
    userId: 10,
    loai: 'chi',
    danhMuc: 'thu_cung',
    moTa: 'Mua pate Royal Canin cho mèo',
    soTien: 95000,
    storage,
  }), true);

  assert.equal(trainFinanceSample({
    userId: 10,
    loai: 'chi',
    danhMuc: 'thu_cung',
    moTa: 'Khám thú y tiêm phòng cho cún',
    soTien: 250000,
    storage,
  }), true);

  const petPred = predictFinanceCategory({
    userId: 10,
    text: 'Mua thêm hạt pate cho mèo con',
    amount: 110000,
    loai: 'chi',
    categories,
    storage,
  });
  assert.equal(petPred.label, 'thu_cung');
  assert.equal(petPred.source, 'personalized');
  assert.equal(petPred.trainedSamples, 2);

  // Override pretrained category: repeatedly categorizing concert tickets under "khac"
  const beforeOverride = predictFinanceCategory({
    userId: 10,
    text: 'Mua vé concert cuối tuần',
    amount: 350000,
    loai: 'chi',
    categories,
    storage,
  });
  assert.equal(beforeOverride.label, 'giai_tri');

  for (let i = 0; i < 2; i++) {
    trainFinanceSample({
      userId: 10,
      loai: 'chi',
      danhMuc: 'khac',
      moTa: 'Mua vé concert cuối tuần',
      soTien: 350000,
      wasPredictedLabel: 'giai_tri',
      weight: 3,
      storage,
    });
  }

  const afterOverride = predictFinanceCategory({
    userId: 10,
    text: 'Mua vé concert cuối tuần',
    amount: 350000,
    loai: 'chi',
    categories,
    storage,
  });
  assert.equal(afterOverride.label, 'khac');
  assert.equal(afterOverride.source, 'personalized');

  // Matching feedback raises accuracy percentage
  trainFinanceSample({
    userId: 10,
    loai: 'chi',
    danhMuc: 'khac',
    moTa: 'Mua vé concert cuối tuần',
    soTien: 350000,
    wasPredictedLabel: 'khac',
    storage,
  });
  const stats = getEdgeAiStats(10, storage);
  assert.equal(stats.feedbackTotal, 3);
  assert.equal(stats.feedbackHits, 1);
  assert.equal(stats.accuracyPct, 33);
});

test('EdgeAI respects active allowed categories and never suggests archived categories', () => {
  const storage = createMemoryStorage();
  const categories = [
    { ma: 'giai_tri', ten: 'Giải trí', loai: 'chi', daAn: true },
    { ma: 'an_uong', ten: 'Ăn uống', loai: 'chi', daAn: false },
    { ma: 'khac', ten: 'Khác', loai: 'chi', daAn: false },
  ];

  const pred = predictFinanceCategory({
    userId: 5,
    text: 'Xem phim CGV và uống trà sữa',
    amount: 140000,
    loai: 'chi',
    categories,
    storage,
  });

  assert.notEqual(pred.label, 'giai_tri');
  assert.ok(['an_uong', 'khac'].includes(pred.label));
  const sumProb = pred.scores.reduce((acc, s) => acc + s.probability, 0);
  assert.ok(Math.abs(sumProb - 1) < 0.01);
});

test('EdgeAI isolates storage per user, deduplicates history sync, handles corrupt JSON, and resets cleanly', () => {
  const storage = createMemoryStorage();

  // Corrupt JSON does not crash prediction or stats
  storage.setItem(edgeStorageKey(101), '{corrupt-json');
  const fallbackPred = predictFinanceCategory({ userId: 101, text: 'Cơm sườn', loai: 'chi', storage });
  assert.equal(fallbackPred.label, 'an_uong');

  // Train User 101 on custom deadline + finance pattern
  const txList = [
    { id: 11, loai: 'chi', danhMuc: 'hoc_phi', moTa: 'Đóng học phí CLB tiếng Anh', soTien: 500000 },
    { id: 12, loai: 'thu', danhMuc: 'thuong', moTa: 'Thưởng hackathon sinh viên', soTien: 1500000 },
  ];
  assert.equal(syncFinanceHistory(101, txList, storage), 2);
  assert.equal(syncFinanceHistory(101, txList, storage), 0);

  const dlList = [
    { id: 21, tieuDe: 'Đọc sách tham khảo Python', hanChot: '2026-12-20', doUuTien: 'thap' },
  ];
  assert.equal(syncDeadlineHistory(101, dlList, storage), 1);
  assert.equal(syncDeadlineHistory(101, dlList, storage), 0);

  // User 101 has learned samples; User 202 remains isolated at 0 samples
  trainDeadlineSample({ userId: 101, tieuDe: 'Nộp tiểu luận đặc biệt', doUuTien: 'cao', storage });
  const stats101 = getEdgeAiStats(101, storage);
  const stats202 = getEdgeAiStats(202, storage);
  assert.equal(stats101.financeSamples, 2);
  assert.equal(stats101.deadlineSamples, 2);
  assert.equal(stats101.totalSamples, 4);
  assert.ok(stats101.storageBytes > 50);

  assert.equal(stats202.totalSamples, 0);
  assert.equal(stats202.storageBytes, 0);

  // Reset removes learned weights and brings counts back to 0
  assert.equal(resetEdgeAiModel(101, null, storage), true);
  const afterReset = getEdgeAiStats(101, storage);
  assert.equal(afterReset.totalSamples, 0);
  assert.equal(afterReset.storageBytes, 0);
});
