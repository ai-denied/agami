import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Dashboard.css';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend
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
  
  // 로컬 타임존 기반 오늘 날짜 문자열 생성 헬퍼
  const getLocalDateStr = (d) => {
    const offset = d.getTimezoneOffset() * 60000;
    return new Date(d - offset).toISOString().split('T')[0];
  };

  const [targetDate, setTargetDate] = useState(() => getLocalDateStr(new Date()));
  const todayStr = getLocalDateStr(new Date());

  const fetchDashboardData = async () => {
    try {
      const response = await axios.get(`https://agami-captcha.cloud/api/dashboard/all?kind=${activeModel}&target_date=${targetDate}`, {
        withCredentials: true
      });
      if (response.data.status === 'success') {
        setDashboardData(response.data.data);
      }
    } catch (error) {
      console.error("대시보드 데이터를 가져오는데 실패했습니다.", error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [activeModel, targetDate, user]);

  const handlePrevDay = () => {
    const d = new Date(targetDate);
    d.setDate(d.getDate() - 1);
    setTargetDate(getLocalDateStr(d));
  };

  const handleNextDay = () => {
    if (targetDate >= todayStr) return;
    const d = new Date(targetDate);
    d.setDate(d.getDate() + 1);
    setTargetDate(getLocalDateStr(d));
  };

  if (loading || !dashboardData) return <div className="dashboard-loading">보안 세션을 확인 중입니다...</div>;
  if (!user) return null;

  const { display, traffic, pieData, behavior, attacks, logs } = dashboardData;

  return (
    <div className="dashboard-container">
      <div className="main-wrapper">
        <div className="content-body">
          <section className="dashboard-header-block">
            <div className="welcome-section">
              <h2>안녕하세요, {user.nickname}님! 안전한 환경을 유지 중입니다</h2>
              <p>Agami 차세대 지능형 캡챠가 실시간 인입 트래픽을 정밀 분석하고 있습니다.</p>
            </div>
            
            <div className="header-controls">
              <div className="date-control-wrapper">
                <div className="date-control-group">
                  <button className="date-arrow-btn" onClick={handlePrevDay}>◀</button>
                  <input 
                    type="date" 
                    value={targetDate} 
                    max={todayStr}
                    onChange={(e) => setTargetDate(e.target.value)} 
                    onClick={(e) => e.target.showPicker && e.target.showPicker()} 
                    onKeyDown={(e) => e.preventDefault()} 
                    className="dashboard-date-picker"
                  />
                  <button 
                    className="date-arrow-btn" 
                    onClick={handleNextDay} 
                    disabled={targetDate >= todayStr}
                  >▶</button>
                </div>
                <button className="refresh-btn" onClick={fetchDashboardData} title="새로고침">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                    <path d="M3 3v5h5" />
                  </svg>
                </button>
              </div>

              <div className="model-tab-container">
                <button className={`tab-btn ${activeModel === 'all' ? 'active' : ''}`} onClick={() => setActiveModel('all')}>전체 모델 현황</button>
                <button className={`tab-btn ${activeModel === 'flashlight' ? 'active' : ''}`} onClick={() => setActiveModel('flashlight')}>손전등</button>
                <button className={`tab-btn ${activeModel === 'facial' ? 'active' : ''}`} onClick={() => setActiveModel('facial')}>안면 인식</button>
                <button className={`tab-btn ${activeModel === 'emotion' ? 'active' : ''}`} onClick={() => setActiveModel('emotion')}>감정 기반</button>
              </div>
            </div>
          </section>

          <section className="summary-grid">
            <div className="summary-card">
              <span className="card-label">해당일 총 요청 수</span>
              <div className="card-value">{display.total_today.toLocaleString()}</div>
            </div>
            <div className="summary-card">
              <span className="card-label">평균 정상 통과율</span>
              <div className="card-value">{display.pass_rate}%</div>
            </div>
            <div className="summary-card">
              <span className="card-label">해당일 공격 차단 건수</span>
              <div className="card-value danger-text">{display.blocked_today.toLocaleString()}</div>
            </div>
            <div className="summary-card">
              <span className="card-label">미인증 / 중도 이탈 건수</span>
              <div className="card-value" style={{ color: 'var(--text-secondary)' }}>{display.abandoned_today?.toLocaleString() || 0}</div>
            </div>
          </section>

          <section className="analytics-grid">
            <div className="left-analytics">
              <div className="chart-card line-chart-card">
                <h3>시간대별 인증/차단/이탈 트래픽 추이</h3>
                <div className="chart-wrapper split-charts">
                  <ResponsiveContainer width="100%" height="33%">
                    <LineChart data={traffic} syncId="trafficSync" margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="0" vertical={false} stroke="var(--chart-grid)" />
                      <XAxis dataKey="time" hide />
                      <YAxis allowDecimals={false} tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--border-color)' }} />
                      <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ fontSize: '12px', paddingBottom: '5px' }}/>
                      <Line type="monotone" dataKey="success" stroke="#5da2ff" strokeWidth={2} dot={false} name="정상 요청" isAnimationActive={false} strokeOpacity={0.8} />
                    </LineChart>
                  </ResponsiveContainer>
                  
                  <ResponsiveContainer width="100%" height="33%">
                    <LineChart data={traffic} syncId="trafficSync" margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="0" vertical={false} stroke="var(--chart-grid)" />
                      <XAxis dataKey="time" hide />
                      <YAxis allowDecimals={false} tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--border-color)' }} />
                      <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ fontSize: '12px', paddingBottom: '5px' }}/>
                      <Line type="monotone" dataKey="attack" stroke="#ff7675" strokeWidth={2} dot={false} name="차단된 공격" isAnimationActive={false} strokeOpacity={0.8} />
                    </LineChart>
                  </ResponsiveContainer>

                  <ResponsiveContainer width="100%" height="33%">
                    <LineChart data={traffic} syncId="trafficSync" margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="0" vertical={false} stroke="var(--chart-grid)" />
                      <XAxis dataKey="time" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} axisLine={false} tickLine={false} />
                      <YAxis allowDecimals={false} tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--border-color)' }} />
                      <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ fontSize: '12px', paddingBottom: '5px' }}/>
                      <Line type="monotone" dataKey="abandoned" stroke="#94a3b8" strokeWidth={2} dot={false} name="중도 이탈" isAnimationActive={false} strokeOpacity={0.8} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="two-column-grid bottom-row-height">
                <div className="sub-card">
                  <h3>유입 트래픽 검증 비율</h3>
                  <div className="pie-container-layout">
                    <div className="pie-wrapper">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie 
                            data={pieData} 
                            innerRadius={48} 
                            outerRadius={62} 
                            paddingAngle={5} 
                            dataKey="value" 
                            startAngle={90} 
                            endAngle={-270}
                            isAnimationActive={false} 
                          >
                            <Cell fill="var(--brand-color)" />
                            <Cell fill="var(--danger-color)" />
                            <Cell fill="#94a3b8" />
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="pie-center-label"><h4>{pieData[0]?.value}%</h4></div>
                    </div>
                    <div className="pie-legend-list">
                      <div className="legend-item"><span className="dot brand" /><span className="lbl">정상 통과 ({pieData[0]?.value}%)</span></div>
                      <div className="legend-item"><span className="dot danger" /><span className="lbl">보안 차단 ({pieData[1]?.value}%)</span></div>
                      <div className="legend-item"><span className="dot abandoned" style={{backgroundColor: '#94a3b8'}} /><span className="lbl">중도 이탈 ({pieData[2]?.value}%)</span></div>
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
                    <div className="metric-bar-group">
                      <div className="metric-bar-label"><span>중도 이탈 (Abandoned)</span><strong>{behavior.abandoned}%</strong></div>
                      <div className="metric-bar-track"><div className="metric-bar-fill abandoned" style={{ width: `${behavior.abandoned}%` }} /></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="right-analytics">
              <div className="log-card line-chart-card">
                <h3>실시간 이상 징후 탐지 로그</h3>
                <div className="log-list-container">
                  <div className="log-list">
                    {logs && logs.length > 0 ? logs.map((log, idx) => {
                      const logClass = log.risk_band === 'high_risk' ? 'danger-log' : (log.risk_band === 'low_risk' ? 'safe-log' : 'warning-log');
                      return (
                        <div key={idx} className={`log-item ${logClass}`}>
                          <span className="log-ip">{log.ip}</span>
                          <span className="log-reason">{log.reason}</span>
                          <span className="risk-score">{log.score}</span>
                        </div>
                      );
                    }) : (
                      <div className="empty-log" style={{color: 'var(--text-secondary)', padding: '20px 0', fontSize: '13px'}}>해당 일자에 탐지된 내역이 없습니다.</div>
                    )}
                  </div>
                </div>
              </div>

              <div className="chart-card bottom-row-height attack-chart-card">
                <h3>주요 우회 공격 유형</h3>
                <div className="chart-wrapper">
                  <ResponsiveContainer width="100%" height="100%">
                    {/* 너비를 140으로 늘려 두 줄 래핑 현상 방지 */}
                    <BarChart layout="vertical" data={attacks} margin={{ left: 0, right: 20, top: 0, bottom: 0 }}>
                      <XAxis type="number" hide allowDecimals={false} />
                      <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} tick={{ fill: 'var(--text-secondary)', fontSize: '12px' }} width={140} />
                      <Tooltip content={<CustomTooltip />} cursor={false} />
                      <Bar dataKey="value" fill="var(--danger-color)" radius={[6, 6, 6, 6]} barSize={10} name="감지 건수" isAnimationActive={false} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}