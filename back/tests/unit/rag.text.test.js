const { terms, chunkPages, retrieve, verifiedAnswer } = require('../../src/modules/rag/rag.text');
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
