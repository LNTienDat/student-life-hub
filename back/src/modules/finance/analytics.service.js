const { vietnamParts } = require('../../utils/date.util');

function pad2(n) {
  return String(n).padStart(2, '0');
}

function mean(values) {
  if (!values.length) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function sampleStdDev(values) {
  if (values.length < 2) return 0;
  const m = mean(values);
  const variance = values.reduce((sum, v) => sum + (v - m) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
}

function quantile(sorted, p) {
  if (!sorted.length) return 0;
  const pos = (sorted.length - 1) * p;
  const base = Math.floor(pos);
  const rest = pos - base;
  return sorted[base + 1] !== undefined
    ? sorted[base] + rest * (sorted[base + 1] - sorted[base])
    : sorted[base];
}

function computeBurnRateForecast({ monthExpenses = [], budgets = [], thang, nam, now = new Date() }) {
  const vnNow = vietnamParts(now);
  const daysInMonth = new Date(Date.UTC(nam, thang, 0)).getUTCDate();
  const targetIndex = nam * 12 + thang;
  const currentIndex = vnNow.year * 12 + vnNow.month;

  let periodStatus = 'current';
  let elapsedDays = Math.min(daysInMonth, Math.max(1, vnNow.day));
  let remainingDays = Math.max(0, daysInMonth - elapsedDays);

  if (targetIndex < currentIndex) {
    periodStatus = 'past';
    elapsedDays = daysInMonth;
    remainingDays = 0;
  } else if (targetIndex > currentIndex) {
    periodStatus = 'future';
    elapsedDays = 0;
    remainingDays = daysInMonth;
  }

  const totalSpent = monthExpenses.reduce((sum, tx) => sum + (Number(tx.soTien) || 0), 0);
  const totalBudget = budgets.reduce((sum, b) => sum + (Number(b.soTienToiDa) || 0), 0);
  const dailyBurnRate = elapsedDays > 0 ? Math.round(totalSpent / elapsedDays) : 0;

  let effectiveDailyRate = dailyBurnRate;
  let recent7DailyRate = null;

  if (periodStatus === 'current' && elapsedDays >= 4) {
    const windowStartDay = Math.max(1, vnNow.day - 6);
    const windowDays = Math.min(7, elapsedDays);
    const recentSpent = monthExpenses.reduce((sum, tx) => {
      const p = vietnamParts(tx.ngayGiaoDich);
      if (p.year === nam && p.month === thang && p.day >= windowStartDay && p.day <= vnNow.day) {
        return sum + (Number(tx.soTien) || 0);
      }
      return sum;
    }, 0);
    recent7DailyRate = Math.round(recentSpent / windowDays);
    effectiveDailyRate = Math.round(0.65 * dailyBurnRate + 0.35 * recent7DailyRate);
  }

  const projectedMonthEndSpent = periodStatus === 'current'
    ? Math.round(totalSpent + effectiveDailyRate * remainingDays)
    : totalSpent;

  const remainingBudget = totalBudget > 0 ? Math.max(0, totalBudget - totalSpent) : null;
  const safeDailyAllowance = totalBudget > 0 && remainingDays > 0
    ? Math.floor(remainingBudget / remainingDays)
    : null;

  let daysUntilBudgetDepleted = null;
  if (totalBudget > 0 && effectiveDailyRate > 0) {
    daysUntilBudgetDepleted = totalSpent >= totalBudget
      ? 0
      : Math.floor((totalBudget - totalSpent) / effectiveDailyRate);
  }

  const willExceedBudget = totalBudget > 0 && projectedMonthEndSpent > totalBudget;
  const projectedOverrun = totalBudget > 0 ? Math.max(0, projectedMonthEndSpent - totalBudget) : 0;

  const spentByCategory = {};
  for (const tx of monthExpenses) {
    if (!tx?.danhMuc) continue;
    spentByCategory[tx.danhMuc] = (spentByCategory[tx.danhMuc] || 0) + (Number(tx.soTien) || 0);
  }

  const severityOrder = { exceeded: 3, high_risk: 2, watch: 1, safe: 0 };
  const categoryForecasts = budgets
    .map((b) => {
      const limit = Number(b.soTienToiDa) || 0;
      const daChi = spentByCategory[b.danhMuc] || 0;
      const catRate = elapsedDays > 0 ? daChi / elapsedDays : 0;
      const projectedEndSpent = periodStatus === 'current'
        ? Math.round(daChi + catRate * remainingDays)
        : daChi;
      const projectedPct = limit > 0 ? Math.round((projectedEndSpent / limit) * 100) : 0;
      const catSafeDaily = limit > 0 && remainingDays > 0
        ? Math.floor(Math.max(0, limit - daChi) / remainingDays)
        : null;

      let riskLevel = 'safe';
      if (limit > 0 && daChi > limit) riskLevel = 'exceeded';
      else if (projectedPct > 100) riskLevel = 'high_risk';
      else if (projectedPct >= 85) riskLevel = 'watch';

      return {
        danhMuc: b.danhMuc,
        soTienToiDa: limit,
        daChi,
        projectedEndSpent,
        projectedPct,
        safeDailyAllowance: catSafeDaily,
        riskLevel,
      };
    })
    .sort((a, b) => (severityOrder[b.riskLevel] - severityOrder[a.riskLevel]) || (b.projectedPct - a.projectedPct));

  return {
    periodStatus,
    daysInMonth,
    elapsedDays,
    remainingDays,
    totalSpent,
    totalBudget,
    dailyBurnRate,
    recent7DailyRate,
    effectiveDailyRate,
    projectedMonthEndSpent,
    remainingBudget,
    safeDailyAllowance,
    daysUntilBudgetDepleted,
    willExceedBudget,
    projectedOverrun,
    categoryForecasts,
  };
}

function detectSpendingAnomalies({ monthExpenses = [], historyExpenses = [], thang, nam }) {
  const allPool = [...historyExpenses, ...monthExpenses].filter((tx) => Number(tx?.soTien) > 0);
  const transactions = [];

  for (const tx of monthExpenses) {
    const amount = Number(tx?.soTien) || 0;
    if (amount < 100000) continue;

    const others = allPool.filter((other) => (tx.id !== undefined ? other.id !== tx.id : other !== tx));
    const catBaseline = others.filter((other) => other.danhMuc === tx.danhMuc).map((o) => Number(o.soTien));
    const globalBaseline = others.map((o) => Number(o.soTien));
    const baseline = catBaseline.length >= 4 ? catBaseline : globalBaseline;
    const scope = catBaseline.length >= 4 ? 'category' : 'overall';

    if (baseline.length < 4) continue;

    const baselineMean = mean(baseline);
    const stdDev = sampleStdDev(baseline);
    const sorted = [...baseline].sort((a, b) => a - b);
    const q1 = quantile(sorted, 0.25);
    const baselineMedian = quantile(sorted, 0.5);
    const q3 = quantile(sorted, 0.75);
    const iqr = q3 - q1;
    const iqrFence = q3 + 1.5 * iqr;

    const zScore = stdDev > 0 ? Number(((amount - baselineMean) / stdDev).toFixed(2)) : 0;
    const ratioToMean = baselineMean > 0 ? Number((amount / baselineMean).toFixed(2)) : 0;

    const hitZ = zScore >= 2.0;
    const hitIqr = (iqr > 0 && amount > iqrFence && amount >= baselineMedian * 2.0)
      || (iqr === 0 && baselineMedian > 0 && amount >= baselineMedian * 3.0);

    if (!hitZ && !hitIqr) continue;

    const method = hitZ && hitIqr ? 'z-score+iqr' : hitZ ? 'z-score' : 'iqr';
    const severity = zScore >= 3.0 || ratioToMean >= 3.5 ? 'high' : 'medium';

    transactions.push({
      id: tx.id ?? null,
      danhMuc: tx.danhMuc,
      moTa: tx.moTa || '',
      soTien: amount,
      ngayGiaoDich: tx.ngayGiaoDich,
      baselineMean: Math.round(baselineMean),
      baselineMedian: Math.round(baselineMedian),
      zScore,
      ratioToMean,
      scope,
      method,
      severity,
      reason: `Gấp ${ratioToMean}x mức chi trung bình (${Math.round(baselineMean).toLocaleString('vi-VN')}đ)`,
    });
  }

  transactions.sort((a, b) => {
    if (a.severity !== b.severity) return a.severity === 'high' ? -1 : 1;
    return (b.zScore - a.zScore) || (b.ratioToMean - a.ratioToMean);
  });

  // Category month-over-month spikes
  const targetPeriodKey = `${nam}-${pad2(thang)}`;
  const currentCatTotals = {};
  for (const tx of monthExpenses) {
    if (!tx?.danhMuc) continue;
    currentCatTotals[tx.danhMuc] = (currentCatTotals[tx.danhMuc] || 0) + (Number(tx.soTien) || 0);
  }

  const histByCategory = {};
  for (const tx of historyExpenses) {
    if (!tx?.danhMuc || !tx?.ngayGiaoDich) continue;
    const p = vietnamParts(tx.ngayGiaoDich);
    const periodKey = `${p.year}-${pad2(p.month)}`;
    if (periodKey === targetPeriodKey) continue;
    if (!histByCategory[tx.danhMuc]) histByCategory[tx.danhMuc] = {};
    histByCategory[tx.danhMuc][periodKey] = (histByCategory[tx.danhMuc][periodKey] || 0) + (Number(tx.soTien) || 0);
  }

  const categorySpikes = [];
  for (const [danhMuc, curTotal] of Object.entries(currentCatTotals)) {
    const monthlyMap = histByCategory[danhMuc];
    if (!monthlyMap) continue;
    const histVals = Object.values(monthlyMap).filter((v) => v > 0);
    if (histVals.length < 2) continue;

    const prevAvg = Math.round(mean(histVals));
    if (prevAvg <= 0) continue;
    if (curTotal >= prevAvg * 1.5 && curTotal - prevAvg >= 200000) {
      const prevStd = sampleStdDev(histVals);
      const zScore = histVals.length >= 3 && prevStd > 0
        ? Number(((curTotal - prevAvg) / prevStd).toFixed(2))
        : null;
      categorySpikes.push({
        danhMuc,
        currentTotal: curTotal,
        previousAvg: prevAvg,
        spikePct: Math.round(((curTotal - prevAvg) / prevAvg) * 100),
        zScore,
      });
    }
  }

  categorySpikes.sort((a, b) => b.spikePct - a.spikePct);

  const slicedTx = transactions.slice(0, 6);
  return {
    transactions: slicedTx,
    categorySpikes,
    totalCount: slicedTx.length + categorySpikes.length,
  };
}

function analyzeFinancePredictions({ monthExpenses = [], historyExpenses = [], budgets = [], thang, nam, now = new Date() }) {
  const burnRate = computeBurnRateForecast({ monthExpenses, budgets, thang, nam, now });
  const anomalies = detectSpendingAnomalies({ monthExpenses, historyExpenses, thang, nam });
  const insights = [];

  if (burnRate.periodStatus === 'current' && burnRate.totalSpent > 0) {
    insights.push(
      `Tốc độ chi trung bình ${burnRate.effectiveDailyRate.toLocaleString('vi-VN')}đ/ngày; dự phóng hết tháng đạt ${burnRate.projectedMonthEndSpent.toLocaleString('vi-VN')}đ.`,
    );
  } else if (burnRate.totalSpent === 0) {
    insights.push(`Tháng ${thang}/${nam} chưa có khoản chi nào để tính tốc độ tiêu dùng.`);
  }

  if (burnRate.totalBudget > 0) {
    if (burnRate.willExceedBudget) {
      insights.push(
        `Cảnh báo: với nhịp chi hiện tại, tổng chi dự phóng vượt ngân sách tháng khoảng ${burnRate.projectedOverrun.toLocaleString('vi-VN')}đ${burnRate.safeDailyAllowance !== null ? ` — nên giữ mức tối đa ${burnRate.safeDailyAllowance.toLocaleString('vi-VN')}đ/ngày` : ''}.`,
      );
    } else if (burnRate.safeDailyAllowance !== null) {
      insights.push(
        `Ngân sách đang trong tầm kiểm soát: mức chi an toàn cho ${burnRate.remainingDays} ngày còn lại là ${burnRate.safeDailyAllowance.toLocaleString('vi-VN')}đ/ngày.`,
      );
    }
  }

  if (anomalies.transactions.length > 0) {
    const top = anomalies.transactions[0];
    insights.push(
      `Phát hiện ${anomalies.transactions.length} khoản chi bất thường (cao nhất: ${top.moTa || top.danhMuc} ${top.soTien.toLocaleString('vi-VN')}đ, gấp ${top.ratioToMean}x mức thường lệ).`,
    );
  }

  if (anomalies.categorySpikes.length > 0) {
    const spike = anomalies.categorySpikes[0];
    insights.push(
      `Nhóm chi "${spike.danhMuc}" tăng đột biến +${spike.spikePct}% so với trung bình các tháng trước.`,
    );
  }

  return {
    thang,
    nam,
    burnRate,
    anomalies,
    insights: insights.slice(0, 4),
    capNhatLuc: now.toISOString(),
  };
}

module.exports = {
  mean,
  sampleStdDev,
  quantile,
  computeBurnRateForecast,
  detectSpendingAnomalies,
  analyzeFinancePredictions,
};
