import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar
} from 'recharts';

// 시뮬레이션 데이터 (브랜드 컬러 톤앤매너 매칭)
const trafficData = [
  { time: '14:00', total: 15000, success: 14200, attack: 800 },
  { time: '17:00', total: 18000, success: 17100, attack: 900 },
  { time: '20:00', total: 22000, success: 21500, attack: 500 },
  { time: '23:00', total: 24392, success: 23800, attack: 592 },
  { time: '02:00', total: 12000, success: 11000, attack: 1000 },
  { time: '05:00', total: 8000, success: 7200, attack: 800 },
  { time: '08:00', total: 14000, success: 13500, attack: 500 },
];

const captchaPieData = [
  { name: '인간 통과', value: 94.2, color: '#5da2ff' },
  { name: 'AI 차단', value: '#ff7675' } // 부드러운 파스텔 레드 계열
];

const attackTypeData = [
  { name: 'GPT-Vision API', value: 412 },
  { name: 'Selenium/자동화', value: 287 },
  { name: 'Headless Chrome', value: 198 },
  { name: '인간 위장 봇', value: 156 },
  { name: 'Tor / VPN', value: 89 },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const [userName, setUserName] = useState('사용자');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const storedName = localStorage.getItem('userName');

    if (!token || !storedName) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('userName');
      localStorage.removeItem('userImage');
      localStorage.removeItem('nickname');
      localStorage.removeItem('profile');
      
      navigate('/login', { replace: true });
      return;
    }

    setUserName(storedName);
    setIsLoading(false);
  }, [navigate]);

  if (isLoading) {
    return <div className="dashboard-loading">보안 세션을 확인 중입니다...</div>;
  }

  return (
    <div className="dashboard-container">
      <div className="main-wrapper">
        <main className="content-body">
          {/* 상단 웰컴 섹션 */}
          <section className="welcome-section">
            <h2>안녕하세요, {userName}님 👋</h2>
            <p>오늘 <strong>1,247건</strong>의 AI 공격을 차단했어요. 시스템은 모두 안정적입니다.</p>
          </section>

          {/* 주요 지표 요약 카드 행 */}
          <section className="summary-grid">
            <div className="summary-card">
              <span className="card-label">오늘 인증 수</span>
              <div className="card-value">184,392</div>
              <span className="card-sub up">+12.4% vs 어제</span>
            </div>
            <div className="summary-card">
              <span className="card-label">인증 성공률</span>
              <div className="card-value">97.8%</div>
              <span className="card-sub up">0.3%p 상승</span>
            </div>
            <div className="summary-card">
              <span className="card-label">평균 인증 시간</span>
              <div className="card-value">1.42초</div>
              <span className="card-sub stable">목표 2.0초 미만</span>
            </div>
            <div className="summary-card">
              <span className="card-label">재시도 비율</span>
              <div className="card-value">2.1%</div>
              <span className="card-sub down">낮을수록 좋음</span>
            </div>
          </section>

          {/* 메인 차트 및 분석 섹션 */}
          <section className="analytics-grid">
            <div className="left-analytics">
              <div className="chart-card">
                <h3>실시간 인증/차단 트래픽 추이</h3>
                <div className="chart-wrapper">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trafficData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--chart-grid)" />
                      <XAxis dataKey="time" tick={{ fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', borderRadius: '12px' }} />
                      <Line type="monotone" dataKey="success" stroke="#5da2ff" strokeWidth={3} dot={false} name="정상 인증" />
                      <Line type="monotone" dataKey="attack" stroke="#ff7675" strokeWidth={3} dot={false} name="차단된 공격" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="two-column-grid">
                <div className="sub-card">
                  <h3>캡챠 통과율 분석</h3>
                  <div className="pie-wrapper">
                    <ResponsiveContainer width="100%" height={160}>
                      <PieChart>
                        <Pie data={captchaPieData} innerRadius={52} outerRadius={68} paddingAngle={4} dataKey="value">
                          <Cell fill="var(--brand-color)" />
                          <Cell fill="var(--danger-color)" />
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="pie-center-label">
                      <h4>94.2%</h4>
                      <p>인간 통과</p>
                    </div>
                  </div>
                </div>

                <div className="sub-card">
                  <h3>사용자 행동 패턴</h3>
                  <div className="behavior-stats">
                    <div className="b-item"><span>클릭 반응 속도</span><strong>312ms</strong></div>
                    <div className="b-item"><span>이동 거리</span><strong>1,847px</strong></div>
                    <div className="b-item"><span>방향 전환 횟수</span><strong>14회</strong></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="right-analytics">
              <div className="chart-card">
                <h3>AI 공격 유형 Top 5</h3>
                <div className="chart-wrapper">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart layout="vertical" data={attackTypeData} margin={{ left: 10, right: 10 }}>
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} tick={{ fill: 'var(--text-secondary)', fontSize: '13px' }} width={110} />
                      <Tooltip contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', borderRadius: '12px' }} />
                      <Bar dataKey="value" fill="var(--danger-color)" radius={[0, 6, 6, 0]} barSize={10} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="log-card">
                <h3>실시간 의심 IP 탐지 로그</h3>
                <div className="log-list">
                  <div className="log-item danger-log">
                    <span className="log-ip">203.0.113.42</span>
                    <span className="log-reason">Headless browser mismatch</span>
                    <span className="risk-score">0.92</span>
                  </div>
                  <div className="log-item danger-log">
                    <span className="log-ip">198.51.100.7</span>
                    <span className="log-reason">Datacenter ASN + Clicks</span>
                    <span className="risk-score">0.88</span>
                  </div>
                  <div className="log-item warning-log">
                    <span className="log-ip">192.0.2.55</span>
                    <span className="log-reason">Suspicious mouse pattern</span>
                    <span className="risk-score">0.76</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}