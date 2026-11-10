import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Dices, RotateCcw, Sparkles, UsersRound, X } from 'lucide-react';
import PickerCanvas from './PickerCanvas';
import './RandomPicker.css';

const defaultStudents = ['An', 'Bình', 'Châu', 'Duy', 'Hà', 'Khang', 'Linh', 'Minh', 'Ngọc', 'Phúc', 'Quân', 'Thảo'];

function parseStudents(value) {
  return [...new Set(value.split(/[\n,]+/).map((name) => name.trim()).filter(Boolean))].slice(0, 30);
}

function Mouse({ student, index, chosen, phase }) {
  return (
    <div
      className={`mouse-card ${chosen && phase === 'race' ? 'mouse-card--winner-running' : ''} ${chosen && phase === 'result' ? 'mouse-card--chosen' : ''} ${phase === 'race' && !chosen ? 'mouse-card--scattering' : ''}`}
      style={{ '--delay': `${index * 0.07}s`, '--rotation': `${(index % 2 ? 1 : -1) * (2 + (index % 3))}deg`, '--lane': `${(index - 5) * 16}px` }}
    >
      <div className="mouse-character" aria-hidden="true">
        <span className="mouse-ear mouse-ear--left" /><span className="mouse-ear mouse-ear--right" />
        <span className="mouse-face"><i /><i /><b /></span><span className="mouse-tail" />
      </div>
      <span className="mouse-name">{student}</span>
    </div>
  );
}

export default function RandomPicker() {
  const [studentInput, setStudentInput] = useState(defaultStudents.join(', '));
  const students = useMemo(() => parseStudents(studentInput), [studentInput]);
  const [winner, setWinner] = useState(null);
  const [phase, setPhase] = useState('idle');
  const [showEditor, setShowEditor] = useState(false);

  useEffect(() => {
    if (winner && !students.includes(winner)) setWinner(null);
  }, [students, winner]);

  function pickStudent() {
    if (!students.length || phase !== 'idle') return;
    const selected = students[Math.floor(Math.random() * students.length)];
    setWinner(selected);
    setPhase('drop');
    window.setTimeout(() => {
      setPhase('race');
    }, 650);
    window.setTimeout(() => setPhase('result'), 2500);
    window.setTimeout(() => setPhase('idle'), 3900);
  }

  return (
    <div className="picker-page">
      <section className="picker-scene" aria-labelledby="picker-title">
        <PickerCanvas students={students} phase={phase} winner={winner} />
        <header className="picker-header">
          <div><Link to="/dashboard" className="picker-kicker inline-flex items-center gap-1.5 mb-1 opacity-80 hover:opacity-100 transition-opacity"><ArrowLeft size={14} /> Quay về Trang chủ</Link><p className="picker-kicker"><Sparkles size={15} /> Trò chơi gọi tên</p><h1 id="picker-title">Ai sẽ ăn phô mai?</h1><p>Chú mèo thả phô mai, một bạn chuột may mắn sẽ được gọi lên trả bài.</p></div>
          <button className="student-editor-trigger" type="button" onClick={() => setShowEditor(true)}><UsersRound size={18} /> Danh sách ({students.length})</button>
        </header>

        <p className={`scene-message ${phase !== 'idle' ? 'scene-message--active' : ''}`}>{phase === 'drop' ? 'Phô mai đang rơi!' : phase === 'race' ? 'Ai sẽ chạy đến trước đây…' : phase === 'result' ? 'Đã có kết quả!' : 'Sẵn sàng thả phô mai!'}</p>

        <div className="sr-only" aria-live="polite">{students.length ? `Có ${students.length} học sinh trong sân chơi.` : 'Hãy thêm ít nhất một tên học sinh.'}</div>
        {winner && phase === 'result' && <aside className="winner-banner" role="status"><span className="winner-cheese">🧀</span><div><small>Hôm nay lên trả bài là</small><strong>{winner}!</strong></div><button type="button" onClick={() => setWinner(null)} aria-label="Đóng kết quả"><X size={18} /></button></aside>}

        <div className="picker-actions"><button className="pick-button" type="button" onClick={pickStudent} disabled={!students.length || phase !== 'idle'}><Dices size={20} />{phase !== 'idle' ? 'Đang chọn...' : 'Thả phô mai'}</button><button className="reset-button" type="button" onClick={() => { setWinner(null); setPhase('idle'); setStudentInput(defaultStudents.join(', ')); }}><RotateCcw size={18} /> Đặt lại</button></div>
      </section>

      {showEditor && <div className="student-modal-backdrop" role="presentation" onMouseDown={() => setShowEditor(false)}><section className="student-modal" role="dialog" aria-modal="true" aria-labelledby="student-modal-title" onMouseDown={(event) => event.stopPropagation()}><button type="button" className="modal-close" aria-label="Đóng" onClick={() => setShowEditor(false)}><X size={20} /></button><p className="picker-kicker"><UsersRound size={15} /> Lớp của bạn</p><h2 id="student-modal-title">Danh sách chú chuột</h2><p>Nhập mỗi tên trên một dòng hoặc ngăn cách bằng dấu phẩy.</p><textarea value={studentInput} onChange={(event) => setStudentInput(event.target.value)} rows={8} autoFocus /><div className="modal-footer"><span>{students.length}/30 học sinh</span><button type="button" className="modal-save" onClick={() => setShowEditor(false)}>Xong</button></div></section></div>}
    </div>
  );
}
