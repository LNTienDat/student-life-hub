const {retrieve,chunkPages}=require('../../src/modules/rag/rag.text');
const guide=require('../../src/modules/rag/lifehub-guide');
const doc={id:99,tieuDe:'Library test fixture',tenTep:'fixture.txt',cacDoan:chunkPages([{page:1,text:'Sinh viên được mượn tối đa 3 cuốn sách trong 14 ngày. Gia hạn sách phải thực hiện trước ngày trả. Đây là dữ liệu giả để kiểm thử.'}])};
const cases=[
  {
    "question": "LifeHub tính GPA như thế nào?",
    "expected": 1,
    "guideOnly": false
  },
  {
    "question": "gpa tinh theo tin chi?",
    "expected": 1,
    "guideOnly": false
  },
  {
    "question": "Trọng số điểm vượt 100% được không?",
    "expected": 1,
    "guideOnly": false
  },
  {
    "question": "Thêm giờ hạn chót deadline",
    "expected": 2,
    "guideOnly": false
  },
  {
    "question": "Nhập thời khóa biểu từ ảnh ra sao?",
    "expected": 3,
    "guideOnly": false
  },
  {
    "question": "nhap thoi khoa bieu tu anh",
    "expected": 3,
    "guideOnly": false
  },
  {
    "question": "Lịch học trùng giờ học kỳ",
    "expected": 4,
    "guideOnly": false
  },
  {
    "question": "Số dư tháng là gì?",
    "expected": 5,
    "guideOnly": false
  },
  {
    "question": "Ngân sách cảnh báo chi tiêu",
    "expected": 6,
    "guideOnly": false
  },
  {
    "question": "Xuất Excel tháng đang chọn",
    "expected": 7,
    "guideOnly": false
  },
  {
    "question": "Đăng nhập nhiều tab tài khoản",
    "expected": 8,
    "guideOnly": false
  },
  {
    "question": "Bản cài PWA kết nối mạng",
    "expected": 9,
    "guideOnly": false
  },
  {
    "question": "Thư viện mượn sách tối đa bao nhiêu cuốn?",
    "expected": 99,
    "guideOnly": false
  },
  {
    "question": "quantum superconducting qubit",
    "expected": null,
    "guideOnly": false
  },
  {
    "question": "Điểm chuẩn ngành y dược 2030",
    "expected": null,
    "guideOnly": false
  },
  {
    "question": "Thư viện mượn sách tối đa bao nhiêu cuốn?",
    "expected": null,
    "guideOnly": true
  }
];
test.each(cases)('retrieval evaluation: $question ($guideOnly)',({question,expected,guideOnly})=>{const first=retrieve(guideOnly?[guide]:[guide,doc],question)[0];expect(first?(first.idTaiLieu===99?99:first.trang):null).toBe(expected);});
