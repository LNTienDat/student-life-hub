import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createVoiceSession,
  isSpeechRecognitionSupported,
  mapSpeechError,
} from '../src/utils/speechRecognition.js';

function createMockWindow({ webkit = false } = {}) {
  const instances = [];
  class MockSpeechRecognition {
    constructor() {
      this.lang = '';
      this.interimResults = false;
      this.continuous = false;
      this.maxAlternatives = 1;
      this.started = false;
      this.stopped = false;
      this.aborted = false;
      instances.push(this);
    }
    start() {
      this.started = true;
    }
    stop() {
      this.stopped = true;
    }
    abort() {
      this.aborted = true;
    }
  }
  const win = webkit
    ? { webkitSpeechRecognition: MockSpeechRecognition }
    : { SpeechRecognition: MockSpeechRecognition };
  return { win, instances };
}

test('isSpeechRecognitionSupported detects standard and webkit constructors', () => {
  assert.equal(isSpeechRecognitionSupported(null), false);
  assert.equal(isSpeechRecognitionSupported({}), false);
  assert.equal(isSpeechRecognitionSupported(createMockWindow().win), true);
  assert.equal(isSpeechRecognitionSupported(createMockWindow({ webkit: true }).win), true);
});

test('mapSpeechError returns clear Vietnamese guidance', () => {
  assert.match(mapSpeechError('not-allowed'), /quyền micro/i);
  assert.match(mapSpeechError('no-speech'), /giọng nói/i);
  assert.match(mapSpeechError('audio-capture'), /Không tìm thấy micro/i);
  assert.match(mapSpeechError('network'), /kết nối/i);
  assert.equal(mapSpeechError('aborted'), '');
  assert.match(mapSpeechError('unknown-error'), /thử lại/i);
});

test('createVoiceSession streams interim transcripts, emits final command once, and ends cleanly', () => {
  const { win, instances } = createMockWindow({ webkit: true });
  const interims = [];
  const finals = [];
  const errors = [];
  let endCount = 0;

  const session = createVoiceSession({
    lang: 'vi-VN',
    win,
    onInterim: (text) => interims.push(text),
    onFinal: (text) => finals.push(text),
    onError: (msg) => errors.push(msg),
    onEnd: () => { endCount++; },
  });

  session.start();
  const rec = instances[0];
  assert.equal(rec.started, true);
  assert.equal(rec.lang, 'vi-VN');
  assert.equal(rec.interimResults, true);

  // Interim speech
  rec.onresult({
    results: [
      Object.assign([{ transcript: 'Ghi chi 45' }], { isFinal: false }),
    ],
  });
  assert.deepEqual(interims, ['Ghi chi 45']);
  assert.deepEqual(finals, []);

  // Final speech
  rec.onresult({
    results: [
      Object.assign([{ transcript: 'Ghi chi 45k trà sữa hôm nay' }], { isFinal: true }),
    ],
  });
  assert.deepEqual(interims, ['Ghi chi 45', 'Ghi chi 45k trà sữa hôm nay']);
  assert.deepEqual(finals, ['Ghi chi 45k trà sữa hôm nay']);

  // Duplicate final does not double-emit
  rec.onresult({
    results: [
      Object.assign([{ transcript: 'Ghi chi 45k trà sữa hôm nay' }], { isFinal: true }),
    ],
  });
  assert.equal(finals.length, 1);

  rec.onend();
  rec.onend();
  assert.equal(endCount, 1);
  assert.deepEqual(errors, []);
});

test('createVoiceSession handles abort and missing browser support safely', () => {
  const { win, instances } = createMockWindow();
  const finals = [];
  const errors = [];
  let endCount = 0;

  const session = createVoiceSession({
    win,
    onFinal: (text) => finals.push(text),
    onError: (msg) => errors.push(msg),
    onEnd: () => { endCount++; },
  });

  session.start();
  session.abort();
  const rec = instances[0];
  assert.equal(rec.aborted, true);
  assert.equal(endCount, 1);

  // Late result & error after abort must be ignored cleanly
  rec.onresult({
    results: [
      Object.assign([{ transcript: 'Ghi chi 10k' }], { isFinal: true }),
    ],
  });
  rec.onerror({ error: 'aborted' });
  rec.onend();
  assert.deepEqual(finals, []);
  assert.deepEqual(errors, []);
  assert.equal(endCount, 1);

  // Unsupported browser fails gracefully
  const unsupportedErrors = [];
  let unsupportedEnded = false;
  createVoiceSession({
    win: {},
    onError: (msg) => unsupportedErrors.push(msg),
    onEnd: () => { unsupportedEnded = true; },
  }).start();
  assert.equal(unsupportedErrors.length, 1);
  assert.equal(unsupportedEnded, true);
});
