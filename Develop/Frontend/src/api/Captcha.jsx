import React, { useState, useEffect, useRef, useCallback } from 'react';
// 제공해주신 API 파일 경로에 맞게 조정하세요
import { issueChallenge, submitAnswer } from '../api/captchaApi'; 

export default function Captcha({ kind = 'flashlight', difficulty = 'easy', onComplete }) {
  const [status, setStatus] = useState('idle');
  const [spec, setSpec] = useState(null);
  const [error, setError] = useState(null);
  const startedAtRef = useRef(null);

  const start = useCallback(async () => {
    setStatus('loading');
    setError(null);
    
    // API 래퍼 호출
    const res = await issueChallenge(kind, difficulty);
    
    if (res.ok) {
      setSpec(res.data);
      startedAtRef.current = Date.now();
      setStatus('active');
    } else {
      setError(res.error);
      setStatus('fail');
    }
  }, [kind, difficulty]);

  const submit = useCallback(async (payload) => {
    if (!spec) return;

    // API 래퍼 호출
    const res = await submitAnswer(spec.challenge_id, payload);
    
    if (res.ok) {
      setStatus('success');
      if (onComplete) onComplete(res.data.captcha_token);
    } else {
      setError(res.error);
      setStatus('fail');
    }
  }, [spec, onComplete]);

  useEffect(() => {
    start();
  }, [start]);

  return (
    <div className="captcha-wrapper">
      {status === 'loading' && <p>챌린지 불러오는 중...</p>}
      
      {status === 'active' && spec && (
        <div className="captcha-active">
          {/* 각 캡챠 종류별 UI 분기 처리가 여기서 들어갑니다 */}
          <p>{kind} 캡챠 진행 중</p>
          <button onClick={() => submit({ /* 실제 payload 삽입 */ })}>
            인증 제출
          </button>
        </div>
      )}

      {status === 'success' && <p>✅ 인증 성공</p>}

      {status === 'fail' && (
        <div>
          <p className="error-text">오류: {error?.message}</p>
          <button onClick={start}>다시 시도</button>
        </div>
      )}
    </div>
  );
}