import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar
} from 'recharts';

// 모델 데이터는 기존과 동일하게 유지
const modelData = {
  all: {
    summary: { total: '184,392', rate: '97.8%', attack: '1,247' },
    traffic: [
      { time: '14:00', success: 14200, attack: 800 },
      { time: '17:00', success: 17100, attack: 900 },
      { time: '20:00', success: 21500, attack: 500 },
      { time: '23:00', success: 23800, attack: 592 },
      { time: '02:00', success: 11000, attack: 1000 },
      { time: '05:00', success: 7200, attack: 800 },
      { time: '08:00', success: 13500, attack: 500 },
    ],
    pie: [{ name: '정상 탐지', value: 94.2 }, { name: '보안 차단', value: 5.8 }],
    behavior: { safe: 88.4, suspicious: 9.2, critical: 2.4 }
  },
  // ... (다른 모델 데이터도 동일하게 유지)
  handlight: { summary: { total: '92,410', rate: '98.1%', attack: '412' }, traffic: [], pie: [{ name: '정상', value: 96.5 }, { name: '차단', value: 3.5 }], behavior: { safe: 92.1, suspicious: 6.4, critical: 1.5 } },
  facial: { summary: { total: '58,122', rate: '97.2%', attack: '520' }, traffic: [], pie: [{ name: '정상', value: 91.8 }, { name: '차단', value: 8.2 }], behavior: { safe: 84.3, suspicious: 12.2, critical: 3.5 } },
  emotion: { summary: { total: '58,122', rate: '97.2%', attack: '520' }, traffic: [], pie: [{ name: '정상', value: 91.8 }, { name: '차단', value: 8.2 }], behavior: { safe: 84.3, suspicious: 12.2, critical: 3.5 } }
};

const attackTypeData = [
  { name: 'GPT-Vision API', value: 412 },
  { name: 'Selenium/자동화', value: 287 },
  { name: 'Headless Chrome', value: 198 },
  { name: '인간 위장형 봇', value: 156 },
  { name: 'Tor / VPN 우회', value: 89 },
];

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-chart-tooltip">
        <p className="tooltip-title">{payload[0].payload.time || payload[0].name}</p>
        {payload.map((item, idx) => (
          <div key={idx} className="tooltip-item">
            <span className="tooltip-dot" style={{ backgroundColor: item.stroke || item.fill }} />
            <span className="tooltip-label">{item.name}:</span>
            <span className="tooltip-value">{item.value.toLocaleString()}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const { user, loading } = useAuth(); // 전역 상태 사용
  const [activeModel, setActiveModel] = useState('all');

  // 로딩 중일 때는 로딩 표시 (PrivateRoute에서 처리되지만 안전장치)
  if (loading) {
    return <div className="dashboard-loading">보안 세션을 확인 중입니다...</div>;
  }

  // user가 없으면 렌더링하지 않음 (PrivateRoute가 리다이렉트 처리함)
  if (!user) return null;

  const current = modelData[activeModel] || modelData.all;

  return (
    <div className="dashboard-container">
      <div className="main-wrapper">
        <main className="content-body">
          <section className="dashboard-header-block">
            <div className="welcome-section">
              <h2>안녕하세요, {user.nickname}님!</h2>
              <p>Agami 차세대 지능형 캡챠가 실시간 인입 트래픽을 정밀 분석하고 있습니다.</p>
            </div>
            <div className="model-tab-container">
              <button className={`tab-btn ${activeModel === 'all' ? 'active' : ''}`} onClick={() => setActiveModel('all')}>전체 모델 현황</button>
              <button className={`tab-btn ${activeModel === 'handlight' ? 'active' : ''}`} onClick={() => setActiveModel('handlight')}>손전등</button>
              <button className={`tab-btn ${activeModel === 'facial' ? 'active' : ''}`} onClick={() => setActiveModel('facial')}>안면 인식</button>
              <button className={`tab-btn ${activeModel === 'emotion' ? 'active' : ''}`} onClick={() => setActiveModel('emotion')}>감정 기반</button>
            </div>
          </section>

          <section className="summary-grid">
            <div className="summary-card">
              <span className="card-label">오늘 총 요청 수</span>
              <div className="card-value">{current.summary.total}</div>
            </div>
            <div className="summary-card">
              <span className="card-label">평균 정상 통과율</span>
              <div className="card-value">{current.summary.rate}</div>
            </div>
            <div className="summary-card">
              <span className="card-label">금일 공격 차단 건수</span>
              <div className="card-value danger-text">{current.summary.attack}</div>
            </div>
          </section>

          <section className="analytics-grid">
            <div className="left-analytics">
              <div className="chart-card">
                <h3>실시간 인증/차단 트래픽 추이</h3>
                <div className="chart-wrapper">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={current.traffic} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="0" vertical={false} stroke="var(--chart-grid)" />
                      <XAxis dataKey="time" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Line type="monotone" dataKey="success" stroke="#5da2ff" strokeWidth={3} dot={false} name="정상 요청" />
                      <Line type="monotone" dataKey="attack" stroke="#ff7675" strokeWidth={3} dot={false} name="차단된 공격" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
            {/* 나머지 차트 및 로그 섹션은 기존과 동일하게 배치 */}
          </section>
        </main>
      </div>
    </div>
  );
}