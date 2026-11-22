const {
  computeBurnRateForecast,
  detectSpendingAnomalies,
  analyzeFinancePredictions,
} = require('../../src/modules/finance/analytics.service');

describe('Finance Predictive Analytics (Burn Rate + Z-score/IQR Anomaly Detection)', () => {
  test('computeBurnRateForecast projects end-of-month spend, safe daily allowance, and category risk', () => {
    const now = new Date('2026-11-15T10:00:00+07:00'); // 15 elapsed, 15 remaining in Nov (30 days)
    const monthExpenses = [
      { id: 1, danhMuc: 'an_uong', soTien: 900000, ngayGiaoDich: '2026-11-02T12:00:00+07:00' },
      { id: 2, danhMuc: 'an_uong', soTien: 1200000, ngayGiaoDich: '2026-11-12T12:00:00+07:00' },
      { id: 3, danhMuc: 'di_lai', soTien: 150000, ngayGiaoDich: '2026-11-10T08:00:00+07:00' },
    ];
    const budgets = [
      { id: 10, danhMuc: 'an_uong', soTienToiDa: 2500000 },
      { id: 11, danhMuc: 'di_lai', soTienToiDa: 600000 },
    ];

    const forecast = computeBurnRateForecast({ monthExpenses, budgets, thang: 11, nam: 2026, now });
    expect(forecast.periodStatus).toBe('current');
    expect(forecast.elapsedDays).toBe(15);
    expect(forecast.remainingDays).toBe(15);
    expect(forecast.totalSpent).toBe(2250000);
    expect(forecast.totalBudget).toBe(3100000);
    expect(forecast.dailyBurnRate).toBe(150000);
    expect(forecast.projectedMonthEndSpent).toBeGreaterThan(3100000);
    expect(forecast.willExceedBudget).toBe(true);
    expect(forecast.safeDailyAllowance).toBe(Math.floor((3100000 - 2250000) / 15));
    expect(forecast.daysUntilBudgetDepleted).toBeLessThan(15);

    expect(forecast.categoryForecasts[0].danhMuc).toBe('an_uong');
    expect(['high_risk', 'exceeded']).toContain(forecast.categoryForecasts[0].riskLevel);
    expect(forecast.categoryForecasts[1].danhMuc).toBe('di_lai');
    expect(forecast.categoryForecasts[1].riskLevel).toBe('safe');

    // Past month does not extrapolate forward
    const past = computeBurnRateForecast({
      monthExpenses: [{ id: 1, danhMuc: 'an_uong', soTien: 500000, ngayGiaoDich: '2026-10-05T10:00:00+07:00' }],
      budgets: [{ id: 1, danhMuc: 'an_uong', soTienToiDa: 1000000 }],
      thang: 10,
      nam: 2026,
      now,
    });
    expect(past.periodStatus).toBe('past');
    expect(past.projectedMonthEndSpent).toBe(500000);
    expect(past.willExceedBudget).toBe(false);
  });

  test('detectSpendingAnomalies flags Z-score and Tukey IQR outliers and category spikes without false positives', () => {
    const historyExpenses = [
      { id: 101, danhMuc: 'an_uong', soTien: 45000, ngayGiaoDich: '2026-09-05T12:00:00+07:00' },
      { id: 102, danhMuc: 'an_uong', soTien: 50000, ngayGiaoDich: '2026-09-12T12:00:00+07:00' },
      { id: 103, danhMuc: 'an_uong', soTien: 40000, ngayGiaoDich: '2026-09-19T12:00:00+07:00' },
      { id: 104, danhMuc: 'an_uong', soTien: 55000, ngayGiaoDich: '2026-10-03T12:00:00+07:00' },
      { id: 105, danhMuc: 'an_uong', soTien: 48000, ngayGiaoDich: '2026-10-14T12:00:00+07:00' },
      { id: 106, danhMuc: 'an_uong', soTien: 52000, ngayGiaoDich: '2026-10-21T12:00:00+07:00' },
    ];
    const monthExpenses = [
      { id: 201, danhMuc: 'an_uong', moTa: 'Cơm trưa', soTien: 48000, ngayGiaoDich: '2026-11-02T12:00:00+07:00' },
      { id: 202, danhMuc: 'an_uong', moTa: 'Tiệc sinh nhật nhà hàng', soTien: 1500000, ngayGiaoDich: '2026-11-15T19:00:00+07:00' },
    ];

    const anomalies = detectSpendingAnomalies({
      monthExpenses,
      historyExpenses,
      thang: 11,
      nam: 2026,
    });

    expect(anomalies.transactions).toHaveLength(1);
    expect(anomalies.transactions[0].id).toBe(202);
    expect(anomalies.transactions[0].severity).toBe('high');
    expect(anomalies.transactions[0].zScore).toBeGreaterThanOrEqual(2);
    expect(anomalies.transactions[0].method).toContain('z-score');

    expect(anomalies.categorySpikes).toHaveLength(1);
    expect(anomalies.categorySpikes[0].danhMuc).toBe('an_uong');
    expect(anomalies.categorySpikes[0].spikePct).toBeGreaterThan(100);
  });

  test('analyzeFinancePredictions returns burnRate, anomalies, and human-readable insights', () => {
    const res = analyzeFinancePredictions({
      monthExpenses: [
        { id: 1, danhMuc: 'an_uong', moTa: 'Cơm', soTien: 45000, ngayGiaoDich: '2026-11-05T12:00:00+07:00' },
      ],
      historyExpenses: [],
      budgets: [{ id: 1, danhMuc: 'an_uong', soTienToiDa: 1000000 }],
      thang: 11,
      nam: 2026,
      now: new Date('2026-11-10T10:00:00+07:00'),
    });

    expect(res.thang).toBe(11);
    expect(res.nam).toBe(2026);
    expect(res.burnRate.totalSpent).toBe(45000);
    expect(res.anomalies.totalCount).toBe(0);
    expect(res.insights.length).toBeGreaterThanOrEqual(1);
  });
});
