import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
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
  const { id: projectId } = useParams();
  
  const [activeModel, setActiveModel] = useState('all');
  const [dashboardData, setDashboardData] = useState(null);
  
  const getLocalDateStr = (d) => {
    const offset = d.getTimezoneOffset() * 60000;
    return new Date(d - offset).toISOString().split('T')[0];
  };

  const [targetDate, setTargetDate] = useState(() => getLocalDateStr(new Date()));
  const todayStr = getLocalDateStr(new Date());

  const fetchDashboardData = async () => {
    try {
      const response = await axios.get(`https://agami-captcha.cloud/api/dashboard/all?kind=${activeModel}&target_date=${targetDate}&project_id=${projectId}`, {
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
    if (user && projectId) {
      fetchDashboardData();
    }
  }, [activeModel, targetDate, user, projectId]);

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

  const ATTACK_TYPE_MAP = {
    'bot_detected': "봇으로 판단됨",
    'normal': "정상 요청",
    'model_high_risk': 'AI 궤적 모델 위험군',
    'no_trajectory': '궤적 데이터 누락',
    'coordinate_brute': '좌표 무작위 대입', 
    'empty_trajectory': '빈 궤적 (Fail-closed)',
    'missing_canvas_dims': '캔버스 규격 조작',
    'inference_unavailable': '추론 API 타임아웃',
    'camera_bypass': '카메라 스트림 우회',
    'face_spoofing': '얼굴 위변조 (Spoofing)',
    'gesture_mismatch': '제스처 벡터 불일치',
    'liveness_fail': '생동감 검증(Liveness) 실패',
    'abnormal_fps': '비정상 프레임 레이트',
    'random_guessing': '비정상 초고속 응답',
    'solve_speed_anomaly': '인간 인지 속도 이탈',
    'pattern_abuse': '문항 수집 및 패턴 남용'
  };

  const ATTACK_DETAIL_MAP = {
    'model_high_risk': '머신러닝 모델이 사용자의 마우스/터치 궤적을 봇(Bot)으로 분류했습니다.',
    'no_trajectory': '사용자 입력 이벤트(MouseMove/Touch)가 전혀 수집되지 않은 자동화 스크립트 의심 요청입니다.',
    'coordinate_brute': '타겟 영역에 대한 좌표 클릭이 정상적인 탐색 과정 없이 비정상적으로 연속 발생했습니다.',
    'empty_trajectory': '수집된 궤적 데이터 배열이 비어있어 정상적인 사용자 상호작용을 증명할 수 없습니다.',
    'missing_canvas_dims': '클라이언트의 렌더링 캔버스 환경 변수가 고의로 조작되었거나 누락되었습니다.',
    'inference_unavailable': '비정상적인 페이로드 크기로 인해 분석 모델 서버와의 통신이 Fail-closed 정책에 의해 차단되었습니다.',
    'camera_bypass': '가상 카메라(OBS 등) 환경 또는 미리 녹화된 영상 스트림의 강제 주입이 의심됩니다.',
    'face_spoofing': '2D 사진, 디스플레이 화면 또는 3D 마스크를 이용한 얼굴 위변조 공격이 탐지되었습니다.',
    'gesture_mismatch': '요청된 행동 지시와 실제 수행된 제스처의 타이밍 및 공간 벡터가 일치하지 않습니다.',
    'liveness_fail': '동적 생동감(Liveness) 지표가 기준치에 미달하는 딥페이크 의심 트래픽입니다.',
    'abnormal_fps': '프레임 레이트(FPS)가 비정상적으로 조작되어 실시간 스트림 속도 검증에 실패했습니다.',
    'random_guessing': '이미지 렌더링 직후 0.5초 이내에 답변을 제출하는 등 무작위 클릭 매크로 패턴이 발견되었습니다.',
    'solve_speed_anomaly': '일반적인 인간의 인지 및 반응 속도 한계선을 완전히 벗어난 비정상적인 초고속 풀이입니다.',
    'pattern_abuse': '동일 세션에서 반복적으로 오답을 생성하며 데이터셋 문항을 수집하려는 크롤링 시도입니다.'
  };

  const CAPTCHA_KIND_MAP = {
    'flashlight': { label: '손전등', icon: '🔦' },
    'face_mission': { label: '안면 인식', icon: '😶' },
    'context_inference': { label: '감정 추론', icon: '🧠' }
  };

  const processedAttacks = (attacks || [])
    .filter(attack => attack.value > 0)
    .map(attack => ({
      ...attack,
      name: ATTACK_TYPE_MAP[attack.name] || attack.name 
    }))
    .sort((a, b) => b.value - a.value);

  return (
    <div className="dashboard-container">
      <div className="main-wrapper">
        <div className="content-body">
          <section className="dashboard-header-block">
            <div className="welcome-section">
              <h2>
                안녕하세요, {user.nickname}님!
                <br className="mobile-break" /> 안전한 환경을 유지 중입니다
              </h2>
              <p>agami 차세대 지능형 캡챠가 실시간 인입 트래픽을 정밀 분석하고 있습니다.</p>
            </div>
            
            <div className="header-controls">
              <div className="date-control-wrapper">
                <div className="date-control-group">
                  <button className="date-arrow-btn" onClick={handlePrevDay}>◀</button>
                  
                  <div className="custom-date-picker-wrapper">
                    <span className="custom-date-text">{targetDate}</span>
                    <svg className="custom-calendar-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                      <line x1="16" y1="2" x2="16" y2="6"></line>
                      <line x1="8" y1="2" x2="8" y2="6"></line>
                      <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                    <input 
                      type="date" 
                      value={targetDate} 
                      max={todayStr}
                      onChange={(e) => setTargetDate(e.target.value)} 
                      onClick={(e) => e.target.showPicker && e.target.showPicker()} 
                      onKeyDown={(e) => e.preventDefault()} 
                      className="hidden-date-input"
                    />
                  </div>

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

              <div className="model-tab-container pc-tabs">
                <button className={`tab-btn ${activeModel === 'all' ? 'active' : ''}`} onClick={() => setActiveModel('all')}>전체 모델 현황</button>
                <button className={`tab-btn ${activeModel === 'flashlight' ? 'active' : ''}`} onClick={() => setActiveModel('flashlight')}>손전등</button>
                <button className={`tab-btn ${activeModel === 'face_mission' ? 'active' : ''}`} onClick={() => setActiveModel('face_mission')}>안면 인식</button>
                <button className={`tab-btn ${activeModel === 'context_inference' ? 'active' : ''}`} onClick={() => setActiveModel('context_inference')}>감정 기반</button>
              </div>

              <div className="model-tab-container mobile-select-container">
                <select 
                  className="mobile-model-select" 
                  value={activeModel} 
                  onChange={(e) => setActiveModel(e.target.value)}
                >
                  <option value="all">전체 모델 현황</option>
                  <option value="flashlight">손전등 캡챠</option>
                  <option value="face_mission">안면 인식 캡챠</option>
                  <option value="context_inference">감정 추론 캡챠</option>
                </select>
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
                      <Line type="monotone" dataKey="success" stroke="#5da2ff" strokeWidth={2} dot={false} name="정상 요청" isAnimationActive={true} strokeOpacity={0.8} />
                    </LineChart>
                  </ResponsiveContainer>
                  
                  <ResponsiveContainer width="100%" height="33%">
                    <LineChart data={traffic} syncId="trafficSync" margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="0" vertical={false} stroke="var(--chart-grid)" />
                      <XAxis dataKey="time" hide />
                      <YAxis allowDecimals={false} tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--border-color)' }} />
                      <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ fontSize: '12px', paddingBottom: '5px' }}/>
                      <Line type="monotone" dataKey="attack" stroke="#ff7675" strokeWidth={2} dot={false} name="차단된 공격" isAnimationActive={true} strokeOpacity={0.8} />
                    </LineChart>
                  </ResponsiveContainer>

                  <ResponsiveContainer width="100%" height="33%">
                    <LineChart data={traffic} syncId="trafficSync" margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="0" vertical={false} stroke="var(--chart-grid)" />
                      <XAxis dataKey="time" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} axisLine={false} tickLine={false} />
                      <YAxis allowDecimals={false} tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--border-color)' }} />
                      <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ fontSize: '12px', paddingBottom: '5px' }}/>
                      <Line type="monotone" dataKey="abandoned" stroke="#94a3b8" strokeWidth={2} dot={false} name="중도 이탈" isAnimationActive={true} strokeOpacity={0.8} />
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
                            isAnimationActive={true} 
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
                      const logClass = log.risk_band === 'high_risk'
                        ? 'danger-log'
                        : (log.risk_band === 'low_risk'
                          ? 'safe-log'
                          : 'warning-log');

                      let defaultDetail = '비정상적인 스크립트 기반 요청으로 분류되어 보안 정책에 의해 차단되었습니다.';
                      
                      if (log.risk_band === 'low_risk' || log.reason === '정상 요청') {
                        defaultDetail = '안전한 기기 및 브라우저 환경에서 발생한 정상적인 사용자 요청입니다.';
                      } else if (log.risk_band === 'warning') {
                        defaultDetail = '일부 의심스러운 패턴이 감지되었으나, 차단 임계치에 도달하지 않아 허용되었습니다.';
                      } else if (log.reason === '봇으로 판단됨') {
                        defaultDetail = '종합적인 행동 신뢰도 분석 결과, 자동화된 봇(Bot)으로 판단되어 차단되었습니다.';
                      }

                      const detailText = log.details || ATTACK_DETAIL_MAP[log.reason] || defaultDetail;

                      return (
                        <div key={idx} className={`log-item ${logClass}`} style={{ display: 'flex', flexDirection: 'column', padding: '12px 14px', gap: '8px', alignItems: 'flex-start', borderBottom: '1px solid var(--border-color)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <span className="log-time" style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--text-primary)' }}>
                                {log.time}
                              </span>
                              
                              {/* 💡 전체 대시보드 탭일 때 캡챠 종류(kind)를 렌더링하는 영역 */}
                              {activeModel === 'all' && log.kind && CAPTCHA_KIND_MAP[log.kind] && (
                                <span style={{ 
                                  fontSize: '11px', 
                                  backgroundColor: 'rgba(93, 162, 255, 0.08)', 
                                  color: 'var(--brand-color)', 
                                  padding: '3px 8px', 
                                  borderRadius: '12px', 
                                  border: '1px solid rgba(93, 162, 255, 0.2)', 
                                  fontWeight: 700 
                                }}>
                                  {CAPTCHA_KIND_MAP[log.kind].icon} {CAPTCHA_KIND_MAP[log.kind].label}
                                </span>
                              )}
                            </div>
                            <span className="risk-score" style={{ fontWeight: 'bold' }}>점수: {log.score}</span>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span className="log-reason" style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '13px' }}>
                              {ATTACK_TYPE_MAP[log.reason] || log.reason}
                            </span>
                            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                              {detailText}
                            </span>
                          </div>
                        </div>
                      );
                    }) : (
                      <div className="empty-log">
                        현재 탐지된 이상 징후가 없습니다
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="chart-card bottom-row-height attack-chart-card">
                <h3>주요 우회 공격 유형</h3>
                <div className="chart-wrapper">
                  {processedAttacks && processedAttacks.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        layout="vertical"
                        data={processedAttacks}
                        margin={{ left: 0, right: 20, top: 0, bottom: 0 }}
                      >
                        <XAxis type="number" hide allowDecimals={false} />
                        <YAxis
                          dataKey="name"
                          type="category"
                          tickLine={false}
                          axisLine={false}
                          tick={{
                            fill: 'var(--text-secondary)',
                            fontSize: '12px'
                          }}
                          width={140}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={false} />
                        <Bar
                          dataKey="value"
                          fill="var(--danger-color)"
                          radius={[6, 6, 6, 6]}
                          barSize={10}
                          name="감지 건수"
                          isAnimationActive={true}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="empty-chart-box">
                      탐지된 우회 공격 유형이 없습니다
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}