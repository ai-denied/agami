import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Dashboard.css';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar
} from 'recharts';

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
  const [dashboardData, setDashboardData] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await axios.get(`https://agami-captcha.cloud/api/dashboard/all?kind=${activeModel}`, {
          withCredentials: true
        });
        if (response.data.status === 'success') {
          setDashboardData(response.data.data);
        }
      } catch (error) {
        console.error("대시보드 데이터를 가져오는데 실패했습니다.", error);
      }
    };

    if (user) {
      fetchDashboardData();
    }
  }, [activeModel, user]);

  if (loading || !dashboardData) return <div className="dashboard-loading">보안 세션을 확인 중입니다...</div>;
  if (!user) return null;

  const { display, traffic, pieData, behavior, attacks, logs } = dashboardData;

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
              <button className={`tab-btn ${activeModel === 'flashlight' ? 'active' : ''}`} onClick={() => setActiveModel('flashlight')}>손전등</button>
              <button className={`tab-btn ${activeModel === 'facial' ? 'active' : ''}`} onClick={() => setActiveModel('facial')}>안면 인식</button>
              <button className={`tab-btn ${activeModel === 'emotion' ? 'active' : ''}`} onClick={() => setActiveModel('emotion')}>감정 기반</button>
            </div>
          </section>

          <section className="summary-grid">
            <div className="summary-card">
              <span className="card-label">오늘 총 요청 수</span>
              <div className="card-value">{display.total_today.toLocaleString()}</div>
            </div>
            <div className="summary-card">
              <span className="card-label">평균 정상 통과율</span>
              <div className="card-value">{display.pass_rate}%</div>
            </div>
            <div className="summary-card">
              <span className="card-label">금일 공격 차단 건수</span>
              <div className="card-value danger-text">{display.blocked_today.toLocaleString()}</div>
            </div>
          </section>

          <section className="analytics-grid">
            <div className="left-analytics">
              <div className="chart-card">
                <h3>실시간 인증/차단 트래픽 추이</h3>
                <div className="chart-wrapper" style={{ minHeight: 250 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={traffic} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                    <div className="pie-wrapper" style={{ minHeight: 140 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={pieData} innerRadius={48} outerRadius={62} paddingAngle={5} dataKey="value" startAngle={90} endAngle={-270}>
                            <Cell fill="var(--brand-color)" />
                            <Cell fill="var(--danger-color)" />
                            <Cell fill="#e0e0e0" />
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="pie-center-label"><h4>{pieData[0]?.value}%</h4></div>
                    </div>
                    <div className="pie-legend-list">
                      <div className="legend-item"><span className="dot brand" /><span className="lbl">정상 사용자 ({pieData[0]?.value}%)</span></div>
                      <div className="legend-item"><span className="dot danger" /><span className="lbl">보안 차단 ({pieData[1]?.value}%)</span></div>
                    </div>
                  </div>
                </div>

                <div className="sub-card">
                  <h3>종합 행동 신뢰도 분포</h3>
                  <div className="behavior-stats">
                    <div className="metric-bar-group">
                      <div className="metric-bar-label"><span>안전 요인 (Safe)</span><strong>{behavior.safe}%</strong></div>
                      <div className="metric-bar-track"><div className="metric-bar-fill safe" style={{ width: `${behavior.safe}%` }} /></div>
                    </div>
                    <div className="metric-bar-group">
                      <div className="metric-bar-label"><span>의심 탐지 (Suspicious)</span><strong>{behavior.suspicious}%</strong></div>
                      <div className="metric-bar-track"><div className="metric-bar-fill suspicious" style={{ width: `${behavior.suspicious}%` }} /></div>
                    </div>
                    <div className="metric-bar-group">
                      <div className="metric-bar-label"><span>위험 수위 (Critical)</span><strong>{behavior.critical}%</strong></div>
                      <div className="metric-bar-track"><div className="metric-bar-fill critical" style={{ width: `${behavior.critical}%` }} /></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="right-analytics">
              <div className="chart-card">
                <h3>주요 우회 공격 유형 Top 5</h3>
                <div className="chart-wrapper" style={{ minHeight: 200 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart layout="vertical" data={attacks} margin={{ left: -10, right: 10, top: 0, bottom: 0 }}>
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
                  {logs && logs.length > 0 ? logs.map((log, idx) => (
                    <div key={idx} className={`log-item ${log.risk_band === 'high_risk' ? 'danger-log' : 'warning-log'}`}>
                      <span className="log-ip">{log.file?.split('_')[1] || "Unknown"}</span>
                      <span className="log-reason">{log.bot_type || log.source_type}</span>
                      <span className="risk-score">{log.bot_risk_score ? Number(log.bot_risk_score).toFixed(2) : "N/A"}</span>
                    </div>
                  )) : (
                    <div className="empty-log" style={{color: 'var(--text-secondary)', padding: '20px 0', fontSize: '13px'}}>이상 징후가 탐지되지 않았습니다.</div>
                  )}
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}