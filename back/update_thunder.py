import json
import uuid
import datetime

token_file = r'D:\note\token.txt'
try:
    with open(token_file, 'r', encoding='utf-8') as f:
        token = f.read().strip()
except Exception:
    token = 'Bearer <token>'

headers = [{'name': 'Authorization', 'value': token}]

def make_req(name, url, method, body_raw=None):
    req = {
        '_id': str(uuid.uuid4()),
        'colId': 'history',
        'containerId': '',
        'name': name,
        'url': url,
        'method': method,
        'sortNum': 0,
        'created': datetime.datetime.utcnow().isoformat() + 'Z',
        'modified': datetime.datetime.utcnow().isoformat() + 'Z',
        'headers': headers,
    }
    if body_raw is not None:
        req['body'] = {
            'type': 'json',
            'raw': body_raw,
            'form': []
        }
    return req

reqs = [
    make_req('http://localhost:5000/api/finance/giao-dich (Chi)', 'http://localhost:5000/api/finance/giao-dich', 'POST', '{\n  "loai": "chi",\n  "danhMuc": "an_uong",\n  "soTien": 50000,\n  "moTa": "Ăn trưa"\n}'),
    make_req('http://localhost:5000/api/finance/giao-dich (Thu)', 'http://localhost:5000/api/finance/giao-dich', 'POST', '{\n  "loai": "thu",\n  "danhMuc": "luong",\n  "soTien": 2000000,\n  "moTa": "Lương part-time"\n}'),
    make_req('http://localhost:5000/api/finance/thong-ke', 'http://localhost:5000/api/finance/thong-ke', 'GET'),
    make_req('http://localhost:5000/api/finance/ngan-sach', 'http://localhost:5000/api/finance/ngan-sach', 'POST', '{\n  "danhMuc": "an_uong",\n  "soTienToiDa": 2000000,\n  "thang": 8,\n  "nam": 2026\n}'),
    make_req('http://localhost:5000/api/finance/ngan-sach/kiem-tra?thang=8&nam=2026', 'http://localhost:5000/api/finance/ngan-sach/kiem-tra?thang=8&nam=2026', 'GET')
]

thunder_path = r'C:\Users\Admin\AppData\Roaming\Code\User\globalStorage\rangav.vscode-thunder-client\thunderActivity.json'

try:
    with open(thunder_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
except Exception:
    data = []

data.extend(reqs)

with open(thunder_path, 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=4, ensure_ascii=False)

print('Success')
