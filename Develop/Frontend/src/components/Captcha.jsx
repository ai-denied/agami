import React, { useState, useEffect, useRef, useCallback } from 'react';

// API 통신을 위한 설정 및 함수를 컴포넌트 내부에 직접 정의
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const CLIENT_KEY = import.meta.env.VITE_CAPTCHA_CLIENT_KEY || 'ck_test';

const callApi = async (url, method, payload = null) => {
  try {
    const res = await fetch(`${API_BASE_URL}${url}`, {
      method,
      headers: { 'Content-Type': 'application/json', 'X-Captcha-Client-Key': CLIENT_KEY },
      body: payload ? JSON.stringify(payload) : null,
    });
    if (!res.ok) return { ok: false, error: { message: 'Network Error' } };
    const data = await res.json();
    return { ok: true, data };
  } catch (err) {
    return { ok: false, error: { message: String(err) } };
  }
};

export default function Captcha({ kind = 'flashlight', difficulty = 'easy', onComplete }) {
  const [status, setStatus] = useState('idle');
  const [spec, setSpec] = useState(null);
  const [error, setError] = useState(null);

  const start = useCallback(async () => {
    setStatus('loading');
    const res = await callApi('/v1/challenges', 'POST', { kind, difficulty });
    if (res.ok) {
      setSpec(res.data);
      setStatus('active');
    } else {
      setError(res.error);
      setStatus('fail');
    }
  }, [kind, difficulty]);

  const submit = useCallback(async (payload) => {
    if (!spec) return;
    const res = await callApi(`/v1/challenges/${encodeURIComponent(spec.challenge_id)}/answer`, 'POST', payload);
    if (res.ok) {
      setStatus('success');
      if (onComplete) onComplete(res.data.captcha_token);
    } else {
      setError(res.error);
      setStatus('fail');
    }
  }, [spec, onComplete]);

  useEffect(() => { start(); }, [start]);

  return (
    <div className="captcha-wrapper">
      {status === 'loading' && <p>로딩 중...</p>}
      {status === 'active' && (
        <div className="captcha-active">
          <p>{kind} 캡챠 진행 중</p>
          <button onClick={() => submit({ click_x: 0, click_y: 0 })}>인증 제출</button>
        </div>
      )}
      {status === 'success' && <p>✅ 인증 성공</p>}
      {status === 'fail' && (
        <div>
          <p>오류: {error?.message}</p>
          <button onClick={start}>다시 시도</button>
        </div>
      )}
    </div>
  );
}