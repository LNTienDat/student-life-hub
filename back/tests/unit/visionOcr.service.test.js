const {
  parseVisionInput,
  normalizeReceiptAi,
  normalizeTimetableAi,
  normalizeTranscriptAi,
  extractWithVisionAI,
} = require('../../src/modules/imports/visionOcr.service');

describe('visionOcr.service', () => {
  const sampleBase64 = Buffer.from('fake-jpeg-binary-content').toString('base64');

  test('rejects invalid kind, missing user consent, or invalid mime type', () => {
    expect(() => parseVisionInput({ kind: 'pdf', dongYGuiAI: true, imageBase64: sampleBase64 }))
      .toThrow(/receipt hoặc timetable/);
    expect(() => parseVisionInput({ kind: 'receipt', dongYGuiAI: false, imageBase64: sampleBase64 }))
      .toThrow(/đồng ý gửi ảnh/);
    expect(() => parseVisionInput({ kind: 'receipt', dongYGuiAI: true, mimeType: 'image/gif', imageBase64: sampleBase64 }))
      .toThrow(/JPEG, PNG hoặc WebP/);
  });

  test('strips data URL prefix cleanly and validates base64 image buffer', () => {
    const parsed = parseVisionInput({
      kind: 'timetable',
      dongYGuiAI: true,
      imageBase64: `data:image/png;base64,${sampleBase64}`,
    });
    expect(parsed).toEqual({
      kind: 'timetable',
      mimeType: 'image/png',
      base64Data: sampleBase64,
    });
  });

  test('normalizes AI receipt output and attaches missing-field warnings safely', () => {
    const valid = normalizeReceiptAi({
      loai: 'chi',
      danhMuc: 'an_uong',
      soTien: 3976000,
      ngayGiaoDich: '2016-02-11',
      moTa: '  SG COFFE\n35 Ly Thuong Kiet  ',
      ghiChu: 'Tra gung, Heineken',
    }, 'gemini-3.5-flash-lite');

    expect(valid).toEqual({
      loai: 'chi',
      danhMuc: 'an_uong',
      soTien: '3976000',
      ngayGiaoDich: '2016-02-11',
      moTa: 'SG COFFE 35 Ly Thuong Kiet',
      warnings: [],
      text: 'Tra gung, Heineken',
      nguon: 'ai_vision',
      model: 'gemini-3.5-flash-lite',
    });

    const missing = normalizeReceiptAi({
      loai: 'unknown',
      danhMuc: 'invalid_cat',
      soTien: -50,
      ngayGiaoDich: '2026-02-31',
      moTa: '',
    }, 'gemini-3.5-flash-lite');

    expect(missing.loai).toBe('chi');
    expect(missing.danhMuc).toBe('khac');
    expect(missing.soTien).toBe('');
    expect(missing.ngayGiaoDich).toBe('');
    expect(missing.moTa).toBe('Hóa đơn');
    expect(missing.warnings).toHaveLength(2);
  });

  test('filters invalid timetable rows and preserves clean schedules', () => {
    const result = normalizeTimetableAi({
      rows: [
        { tenMon: 'Chuyển đổi số', thu: 3, gioBatDau: '13:00', gioKetThuc: '17:15', phongHoc: 'I7-03 (học đường)', giangVien: 'ThS. Trương Thanh Thảo' },
        { tenMon: 'Lớp sai thứ', thu: 9, gioBatDau: '07:00', gioKetThuc: '09:00', phongHoc: 'A101', giangVien: '' },
        { tenMon: 'Lớp sai giờ', thu: 2, gioBatDau: '10:00', gioKetThuc: '09:00', phongHoc: 'A101', giangVien: '' },
      ],
    }, 'gemini-3.5-flash-lite');

    expect(result.nguon).toBe('ai_vision');
    expect(result.rows).toEqual([
      {
        tenMon: 'Chuyển đổi số',
        thu: 3,
        gioBatDau: '13:00',
        gioKetThuc: '17:15',
        phongHoc: 'I7-03 (học đường)',
        giangVien: 'ThS. Trương Thanh Thảo',
      },
    ]);
  });

  test('fails with 503 when AI is disabled and succeeds with mocked Gemini response', async () => {
    await expect(extractWithVisionAI(
      { kind: 'receipt', dongYGuiAI: true, imageBase64: sampleBase64 },
      { getAiConfig: () => ({ sanSang: false, model: 'gemini-3.5-flash-lite', key: '' }) }
    )).rejects.toMatchObject({ statusCode: 503, code: 'OCR_AI_NOT_CONFIGURED' });

    const mockFetch = async () => ({
      ok: true,
      json: async () => ({
        candidates: [{
          finishReason: 'STOP',
          content: {
            parts: [{
              text: JSON.stringify({
                loai: 'chi',
                danhMuc: 'an_uong',
                soTien: 54000,
                ngayGiaoDich: '2019-02-18',
                moTa: 'CÀ PHÊ HOÀNG PHÚC',
                ghiChu: 'Cà phê đá, cơm tấm',
              }),
            }],
          },
        }],
      }),
    });

    const receipt = await extractWithVisionAI(
      { kind: 'receipt', dongYGuiAI: true, imageBase64: sampleBase64 },
      {
        getAiConfig: () => ({ sanSang: true, model: 'gemini-3.5-flash-lite', key: 'x'.repeat(30) }),
        fetchImpl: mockFetch,
      }
    );

    expect(receipt.soTien).toBe('54000');
    expect(receipt.ngayGiaoDich).toBe('2019-02-18');
    expect(receipt.moTa).toBe('CÀ PHÊ HOÀNG PHÚC');
    expect(receipt.nguon).toBe('ai_vision');
  });

  test('normalizes AI transcript output across 10-point, 4-point, and letter grades safely', () => {
    const parsed = parseVisionInput({ kind: 'transcript', dongYGuiAI: true, imageBase64: sampleBase64 });
    expect(parsed.kind).toBe('transcript');

    const normalized = normalizeTranscriptAi({
      rows: [
        {
          tenMon: 'Cơ sở dữ liệu',
          tinChi: 3,
          hocKy: 'HK1 2025-2026',
          diems: [
            { loaiDanhGia: 'Giữa kỳ', diem: '8.5', scale: '10', trongSo: 30 },
            { loaiDanhGia: 'Cuối kỳ', diem: '3.5', scale: '4', trongSo: 70 },
          ],
        },
        {
          tenMon: 'Tiếng Anh 1',
          tinChi: 0,
          hocKy: '',
          diems: [{ loaiDanhGia: 'Tổng kết', diem: 'B+', scale: 'letter', trongSo: 100 }],
        },
      ],
    }, 'gemini-3.5-flash-lite');

    expect(normalized.nguon).toBe('ai_vision');
    expect(normalized.rows).toHaveLength(2);
    expect(normalized.rows[0].diems[0].diem).toBe(8.5);
    expect(normalized.rows[0].diems[1].diem).toBe(8);
    expect(normalized.rows[1].tinChi).toBe(3);
    expect(normalized.rows[1].tinChiMacDinh).toBe(true);
    expect(normalized.rows[1].diems[0].diem).toBe(8);
  });

  test('converts fractional weights and drops redundant Tổng kết summary column when components total 100%', () => {
    const normalized = normalizeTranscriptAi({
      rows: [
        {
          tenMon: 'Trí tuệ nhân tạo',
          tinChi: 3,
          hocKy: 'HK1-2025',
          diems: [
            { loaiDanhGia: 'Giữa kỳ', diem: '8.5', scale: '10', trongSo: 0.4 },
            { loaiDanhGia: 'Cuối kỳ', diem: '9.0', scale: '10', trongSo: 0.6 },
            { loaiDanhGia: 'Tổng kết', diem: '8.8', scale: '10', trongSo: 1.0 },
          ],
        },
      ],
    }, 'gemini-3.5-flash-lite');

    expect(normalized.rows[0].diems).toEqual([
      { loaiDanhGia: 'Giữa kỳ', diem: 8.5, rawValue: '8.5', inputScale: '10', trongSo: 40 },
      { loaiDanhGia: 'Cuối kỳ', diem: 9, rawValue: '9.0', inputScale: '10', trongSo: 60 },
    ]);
  });
});
