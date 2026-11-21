const { terms, embedText, cosineSimilarity, VECTOR_DIM, chunkPages, retrieve, verifiedAnswer } = require('../../src/modules/rag/rag.text');
const guide = require('../../src/modules/rag/lifehub-guide');
test('Vietnamese accents and repeated query terms normalize consistently', () => {
 expect(terms('Điểm ĐIỂM diem')).toEqual(['diem','diem','diem']);
 expect(retrieve([guide],'LifeHub tính GPA như thế nào?')[0].trang).toBe(1);
 expect(retrieve([guide],'nhap thoi khoa bieu tu anh')[0].trang).toBe(3);
});
test('chunks are bounded, ordered, preserve pages and overlap without looping', () => {
 const chunks=chunkPages([{page:7,text:'Một đoạn dài. '.repeat(500)},{page:8,text:'x'.repeat(3000)}]);
 expect(chunks.length).toBeGreaterThan(5);
 expect(chunks.every(c=>c.noiDung.length<=1201)).toBe(true);
 expect(chunks.map(c=>c.thuTu)).toEqual(chunks.map((_,i)=>i+1));
 expect(chunks[0].trang).toBe(7); expect(chunks.at(-1).trang).toBe(8);
});
test.each(['', 'và của với', 'quantum superconducting qubit'])('unrelated query has no source: %s', q=>expect(retrieve([guide],q)).toEqual([]));
const sources=[{ma:'S1',noiDung:'Source'}];
test('valid citations are rendered by server and limited to used sources',()=>{
 expect(verifiedAnswer(JSON.stringify({duThongTin:true,cauTraLoi:[{noiDung:'Answer',nguon:['S1','S1']}]}),sources)).toEqual({duThongTin:true,traLoi:'Answer [S1]',thamKhao:sources});
});
test.each(['null','[]','{}','broken',JSON.stringify({duThongTin:true,cauTraLoi:[null]}),JSON.stringify({duThongTin:true,cauTraLoi:[{noiDung:'x',nguon:['S99']}]}),JSON.stringify({duThongTin:true,cauTraLoi:[{noiDung:'fake [S99]',nguon:['S1']}]}),JSON.stringify({duThongTin:true,cauTraLoi:[{noiDung:'x',nguon:[]}]})])('malformed or invented citations fall back: %s',raw=>expect(verifiedAnswer(raw,sources)).toBeNull());
test('model can explicitly abstain',()=>expect(verifiedAnswer('{"duThongTin":false,"cauTraLoi":[]}',sources).duThongTin).toBe(false));

test.each([
 ['TKB từ ảnh',3], ['nhập lịch học từ ảnh',3], ['thêm giờ hạn nộp',2],
])('Vietnamese aliases retrieve original source: %s',(q,page)=>{
 expect(retrieve([guide],q)[0]?.trang).toBe(page);
});
test.each([
 {noiDung:'Có thể mượn 99 cuốn trong 14 ngày.',nguon:['S1']},
 {noiDung:'Xem https://fake.example/login',nguon:['S1']},
 {noiDung:'Thông tin [s99]',nguon:['S1']},
])('unbacked facts and disguised source labels are rejected',part=>{
 expect(verifiedAnswer(JSON.stringify({duThongTin:true,cauTraLoi:[part]}),[{ma:'S1',noiDung:'Mượn 3 cuốn trong 14 ngày.'}])).toBeNull();
});

test('embedText produces L2-normalized semantic vectors with higher cosine similarity for synonymous academic queries', () => {
  const v1 = embedText('điểm chuẩn xét tuyển đại học');
  const v2 = embedText('điểm trúng tuyển đầu vào');
  const v3 = embedText('chi tiêu ăn uống cà phê');
  expect(v1).toHaveLength(VECTOR_DIM);
  expect(cosineSimilarity(v1, v2)).toBeGreaterThan(0.5);
  expect(cosineSimilarity(v1, v2)).toBeGreaterThan(cosineSimilarity(v1, v3));
});

test('hybrid semantic retrieval finds synonymous scholarship rules and verifiedAnswer accepts comma/dot decimals', () => {
  const policyDoc = {
    id: 77, tieuDe: 'Quy chế học bổng', tenTep: 'hocbong.txt',
    cacDoan: chunkPages([{ page: 1, text: 'Sinh viên đạt loại giỏi được xét cấp học bổng khuyến khích học tập.' }]),
  };
  const hits = retrieve([policyDoc], 'Điều kiện nhận trợ cấp khen thưởng học tập?');
  expect(hits).toHaveLength(1);
  expect(hits[0].idTaiLieu).toBe(77);
  const verified = verifiedAnswer(
    JSON.stringify({ duThongTin: true, cauTraLoi: [{ noiDung: 'Điểm trúng tuyển là 28,73', nguon: ['S1'] }] }),
    [{ ma: 'S1', noiDung: 'Điểm chuẩn: 28.73' }],
  );
  expect(verified?.duThongTin).toBe(true);
});

test('comprehensive chapter query pulls consecutive chunks until the next chapter header', () => {
  const ch1Part1 = [
    'GIẢI ĐÁP BÀI TẬP LẬP TRÌNH PYTHON (CHƯƠNG 1 - 6)',
    'Chương 1: TỔNG QUAN VỀ NGÔN NGỮ LẬP TRÌNH PYTHON',
    '1. Trình bày khái niệm chương trình dịch.',
    '2. Phân biệt biên dịch và thông dịch.',
    '3. Nêu các đặc điểm của Python.',
    '4. Python được dùng trong lĩnh vực nào?',
    '5. Cài đặt môi trường Anaconda.',
    '6. IDE phổ biến cho Python.',
  ].join('\n');
  const ch1Part2 = [
    '7. Biến trong Python khai báo thế nào?',
    '8. Kiểu dữ liệu cơ bản.',
    '9. Ép kiểu tường minh.',
    '10. Toán tử số học.',
    '11. Hàm input() và print().',
    '12. Ghi chú nhiều dòng.',
  ].join('\n');
  const ch1Part3 = [
    '13. Giải thích lệnh "$pip install spyder" và vai trò của nó.',
    '14. Kiểm tra phiên bản Python đã cài đặt.',
    '15. Trình bày cú pháp đúng để nhập mô-đun.',
    '16. Import mô-đun math cho sqrt(), pow().',
    '17. Mô-đun random().',
    '18. Mô-đun os.',
    '19. Mô-đun datetime hoặc time.',
    '20. Python được phát triển theo giấy phép PSFL nào và tổ chức nào phê duyệt?',
  ].join('\n');
  const ch2 = [
    'Chương 2: LẬP TRÌNH CĂN BẢN',
    '1. Kết quả đoạn mã x=y=z="Orange".',
    '2. Câu lệnh điều kiện if-else.',
  ].join('\n');
  const pythonDoc = {
    id: 88,
    tieuDe: 'Lap_Trinh_PYTHON',
    tenTep: 'Lap_Trinh_PYTHON.pdf',
    cacDoan: [
      { id: 1, thuTu: 1, trang: 1, noiDung: ch1Part1 },
      { id: 2, thuTu: 2, trang: 1, noiDung: ch1Part2 },
      { id: 3, thuTu: 3, trang: 2, noiDung: ch1Part3 },
      { id: 4, thuTu: 4, trang: 2, noiDung: ch2 },
    ],
  };
  const hits = retrieve([pythonDoc], 'file lập trình python, chương 1 có mấy câu hỏi', 6);
  const joined = hits.map(h => h.noiDung).join('\n');
  expect(joined).toContain('Chương 1: TỔNG QUAN');
  expect(joined).toContain('13. Giải thích lệnh');
  expect(joined).toContain('20. Python được phát triển theo giấy phép PSFL');
  expect(joined).not.toContain('Chương 2: LẬP TRÌNH CĂN BẢN');
});

test('chapter retrieval uses document title tokens when chunks omit the filename keyword', () => {
  const sparseDoc = {
    id: 99,
    tieuDe: 'Lap_Trinh_PYTHON',
    tenTep: 'Lap_Trinh_PYTHON.pdf',
    cacDoan: [
      { id: 1, thuTu: 1, trang: 1, noiDung: 'Chương 1: TỔNG QUAN\n1. Khái niệm chương trình dịch.\n2. Biên dịch và thông dịch.' },
      { id: 2, thuTu: 2, trang: 1, noiDung: '19. Xử lý ngày tháng.\n20. Giấy phép PSFL.' },
      { id: 3, thuTu: 3, trang: 2, noiDung: 'Chương 2: BIẾN VÀ KIỂU DỮ LIỆU\n1. Khai báo biến.' },
    ],
  };
  const hits = retrieve([sparseDoc], 'file lập trình python, chương 1 có mấy câu hỏi', 6);
  const joined = hits.map(h => h.noiDung).join('\n');
  expect(joined).toContain('Chương 1: TỔNG QUAN');
  expect(joined).toContain('20. Giấy phép PSFL.');
  expect(joined).not.toContain('Chương 2: BIẾN VÀ KIỂU DỮ LIỆU');
});
