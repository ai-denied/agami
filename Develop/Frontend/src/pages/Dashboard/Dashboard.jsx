import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar
} from 'recharts';

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
  handlight: {
    summary: { total: '92,410', rate: '98.1%', attack: '412' },
    traffic: [
      { time: '14:00', success: 7100, attack: 210 },
      { time: '17:00', success: 8500, attack: 190 },
      { time: '20:00', success: 10800, attack: 80 },
      { time: '23:00', success: 11900, attack: 112 },
      { time: '02:00', success: 5400, attack: 310 },
      { time: '05:00', success: 3500, attack: 140 },
      { time: '08:00', success: 6800, attack: 90 },
    ],
    pie: [{ name: '정상 탐지', value: 96.5 }, { name: '보안 차단', value: 3.5 }],
    behavior: { safe: 92.1, suspicious: 6.4, critical: 1.5 }
  },
  facial: {
    summary: { total: '58,122', rate: '97.2%', attack: '520' },
    traffic: [
      { time: '14:00', success: 4200, attack: 410 },
      { time: '17:00', success: 4800, attack: 520 },
      { time: '20:00', success: 6100, attack: 280 },
      { time: '23:00', success: 6900, attack: 310 },
      { time: '02:00', success: 2800, attack: 550 },
      { time: '05:00', success: 1900, attack: 420 },
      { time: '08:00', success: 3800, attack: 290 },
    ],
    pie: [{ name: '정상 탐지', value: 91.5 }, { name: '보안 차단', value: 8.5 }],
    behavior: { safe: 82.5, suspicious: 13.5, critical: 4.0 }
  },
  emotion: {
    summary: { total: '33,860', rate: '95.4%', attack: '315' },
    traffic: [
      { time: '14:00', success: 2800, attack: 150 },
      { time: '17:00', success: 3100, attack: 180 },
      { time: '20:00', success: 4200, attack: 90 },
      { time: '23:00', success: 5000, attack: 120 },
      { time: '02:00', success: 1500, attack: 220 },
      { time: '05:00', success: 900, attack: 190 },
      { time: '08:00', success: 2500, attack: 80 },
    ],
    pie: [{ name: '정상 탐지', value: 89.2 }, { name: '보안 차단', value: 10.8 }],
    behavior: { safe: 78.0, suspicious: 15.5, critical: 6.5 }
  }
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
  const { user, loading } = useAuth();
  const [activeModel, setActiveModel] = useState('all');

  if (loading) return <div className="dashboard-loading">보안 세션을 확인 중입니다...</div>;
  if (!user) return null;

  const current = modelData[activeModel] || modelData.all;

  return (
    <div className="dashboard-container">
      <div className="main-wrapper">
        <main className="content-body">
          <section className="dashboard-header-block">
            <div className="welcome-section">
              <h2>안녕하세요, {user.nickname}님! 안전한 환경을 유지 중입니다</h2>
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
              <span className="card-sub up">+12.4% vs 어제</span>
            </div>
            <div className="summary-card">
              <span className="card-label">평균 정상 통과율</span>
              <div className="card-value">{current.summary.rate}</div>
              <span className="card-sub up">0.3%p 상승</span>
            </div>
            <div className="summary-card">
              <span className="card-label">금일 공격 차단 건수</span>
              <div className="card-value danger-text">{current.summary.attack}</div>
              <span className="card-sub stable">안정적인 차단 상태</span>
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
                      <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--border-color)', strokeWidth: 1 }} />
                      <Line type="monotone" dataKey="success" stroke="#5da2ff" strokeWidth={3} dot={false} name="정상 요청" />
                      <Line type="monotone" dataKey="attack" stroke="#ff7675" strokeWidth={3} dot={false} name="차단된 공격" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="two-column-grid">
                <div className="sub-card">
                  <h3>인입 트래픽 검증 분석</h3>
                  <div className="pie-container-layout">
                    <div className="pie-wrapper">
                      <ResponsiveContainer width="100%" height={140}>
                        <PieChart>
                          <Pie data={current.pie} innerRadius={48} outerRadius={62} paddingAngle={5} dataKey="value" startAngle={90} endAngle={-270}>
                            <Cell fill="var(--brand-color)" />
                            <Cell fill="var(--danger-color)" />
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="pie-center-label"><h4>{current.pie[0].value}%</h4></div>
                    </div>
                    <div className="pie-legend-list">
                      <div className="legend-item"><span className="dot brand" /><span className="lbl">정상 사용자 ({current.pie[0].value}%)</span></div>
                      <div className="legend-item"><span className="dot danger" /><span className="lbl">보안 차단 ({current.pie[1].value}%)</span></div>
                    </div>
                  </div>
                </div>

                <div className="sub-card">
                  <h3>종합 행동 신뢰도 분포</h3>
                  <div className="behavior-stats">
                    <div className="metric-bar-group">
                      <div className="metric-bar-label"><span>안전 요인 (Safe)</span><strong>{current.behavior.safe}%</strong></div>
                      <div className="metric-bar-track"><div className="metric-bar-fill safe" style={{ width: `${current.behavior.safe}%` }} /></div>
                    </div>
                    <div className="metric-bar-group">
                      <div className="metric-bar-label"><span>의심 탐지 (Suspicious)</span><strong>{current.behavior.suspicious}%</strong></div>
                      <div className="metric-bar-track"><div className="metric-bar-fill suspicious" style={{ width: `${current.behavior.suspicious}%` }} /></div>
                    </div>
                    <div className="metric-bar-group">
                      <div className="metric-bar-label"><span>위험 수위 (Critical)</span><strong>{current.behavior.critical}%</strong></div>
                      <div className="metric-bar-track"><div className="metric-bar-fill critical" style={{ width: `${current.behavior.critical}%` }} /></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="right-analytics">
              <div className="chart-card">
                <h3>주요 우회 공격 유형 Top 5</h3>
                <div className="chart-wrapper">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart layout="vertical" data={attackTypeData} margin={{ left: -10, right: 10, top: 0, bottom: 0 }}>
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} tick={{ fill: 'var(--text-secondary)', fontSize: '13px' }} width={115} />
                      <Tooltip content={<CustomTooltip />} cursor={false} />
                      <Bar dataKey="value" fill="var(--danger-color)" radius={[0, 6, 6, 0]} barSize={10} name="감지 건수" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="log-card">
                <h3>실시간 이상 징후 탐지 로그</h3>
                <div className="log-list">
                  <div className="log-item danger-log"><span className="log-ip">203.0.113.42</span><span className="log-reason">Headless browser mismatch</span><span className="risk-score">0.92</span></div>
                  <div className="log-item danger-log"><span className="log-ip">198.51.100.7</span><span className="log-reason">Datacenter ASN 패턴 유입</span><span className="risk-score">0.88</span></div>
                  <div className="log-item warning-log"><span className="log-ip">192.0.2.55</span><span className="log-reason">비정상 마우스 가속도 탐지</span><span className="risk-score">0.76</span></div>
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}