const ERROR_MESSAGES = {
  'not-allowed': 'Bạn chưa cấp quyền micro cho trình duyệt.',
  'service-not-allowed': 'Dịch vụ nhận diện giọng nói đang bị chặn trên trình duyệt này.',
  'no-speech': 'Chưa nghe thấy giọng nói. Hãy thử nói lại gần micro hơn.',
  'audio-capture': 'Không tìm thấy micro hoạt động trên thiết bị.',
  network: 'Không kết nối được dịch vụ nhận diện giọng nói của trình duyệt.',
  aborted: '',
};

export function isSpeechRecognitionSupported(win = typeof window !== 'undefined' ? window : null) {
  return Boolean(win && (win.SpeechRecognition || win.webkitSpeechRecognition));
}

export function mapSpeechError(code) {
  if (!code) return 'Chưa nhận diện được giọng nói. Hãy thử lại.';
  if (Object.hasOwn(ERROR_MESSAGES, code)) return ERROR_MESSAGES[code];
  return 'Chưa nhận diện được giọng nói. Hãy thử lại.';
}

export function mergeVoiceTranscript(existingDraft = '', transcript = '') {
  const base = String(existingDraft || '').trim();
  const spoken = String(transcript || '').trim();
  if (!spoken) return base;
  if (!base) return spoken;
  return `${base} ${spoken}`;
}

export function createVoiceSession({
  lang = 'vi-VN',
  onInterim = null,
  onFinal = null,
  onError = null,
  onEnd = null,
  win = typeof window !== 'undefined' ? window : null,
} = {}) {
  const SpeechCtor = win?.SpeechRecognition || win?.webkitSpeechRecognition;
  if (!SpeechCtor) {
    onError?.('Trình duyệt hiện tại chưa hỗ trợ nhập liệu giọng nói.');
    onEnd?.();
    return { start() {}, stop() {}, abort() {} };
  }

  const recognition = new SpeechCtor();
  recognition.lang = lang;
  recognition.interimResults = true;
  recognition.continuous = false;
  recognition.maxAlternatives = 1;

  let ended = false;
  let finalEmitted = false;
  let aborted = false;

  function finish() {
    if (ended) return;
    ended = true;
    onEnd?.();
  }

  recognition.onresult = (event) => {
    if (aborted) return;
    const results = event?.results;
    if (!results) return;

    let finalParts = [];
    let interimParts = [];
    for (let i = 0; i < results.length; i++) {
      const item = results[i];
      const text = item?.[0]?.transcript || '';
      if (!text) continue;
      if (item.isFinal) finalParts.push(text);
      else interimParts.push(text);
    }

    const finalText = finalParts.join(' ').trim();
    const preview = (finalText || interimParts.join(' ')).trim();
    if (preview) {
      onInterim?.(preview);
    }
    if (finalText && !finalEmitted) {
      finalEmitted = true;
      onFinal?.(finalText);
    }
  };

  recognition.onerror = (event) => {
    const code = event?.error;
    if (!aborted && code !== 'aborted') {
      const msg = mapSpeechError(code);
      if (msg) onError?.(msg);
    }
    finish();
  };

  recognition.onend = () => {
    finish();
  };

  return {
    start() {
      try {
        recognition.start();
      } catch {
        onError?.('Không thể khởi động micro lúc này.');
        finish();
      }
    },
    stop() {
      try {
        recognition.stop();
      } catch {
        finish();
      }
    },
    abort() {
      aborted = true;
      try {
        recognition.abort();
      } catch {
        // Ignore abort errors during cleanup.
      }
      finish();
    },
  };
}
