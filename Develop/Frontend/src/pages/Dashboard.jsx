import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar
} from 'recharts';

// 시뮬레이션 데이터
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
  { name: 'AI 차단', value: 5.8, color: '#ff5c5c' }
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
  const [darkMode, setDarkMode] = useState(false);
  const [userName, setUserName] = useState('사용자');
  const [userImage, setUserImage] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const storedName = localStorage.getItem('userName');
    const storedImage = localStorage.getItem('userImage');

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

    if (storedImage) {
      const secureImageUrl = storedImage.replace(/^http:\/\//i, 'https://');
      setUserImage(secureImageUrl);
    }

    setIsLoading(false);
  }, [navigate]);

  if (isLoading) {
    return <div className="dashboard-loading">보안 세션을 확인 중입니다...</div>;
  }

  const avatarInitial = userName ? userName.charAt(0) : '유';

  return (
    <div className={`dashboard-container ${darkMode ? 'dark-mode' : ''}`}>
      {/* 1. 사이드바 */}
      <aside className="sidebar">
        {/* [교정] 상단 네비바와 중복되는 logo-area 엘리먼트 완전히 제거 */}
        
        {/* 미니 사용자 프로필 정보 영역 */}
        <div className="sidebar-profile">
          <div className="profile-avatar-wrapper">
            {userImage ? (
              <img src={userImage} alt="User Profile" className="profile-img-element" />
            ) : (
              <span className="profile-text-avatar">{avatarInitial}</span>
            )}
          </div>
          <div className="profile-info-text">
            <span className="profile-name">{userName} 님</span>
            <span className="profile-role">Administrator</span>
          </div>
        </div>
        
        <nav className="nav-menu">
          <div className="menu-group">모니터링</div>
          <a href="#active" className="nav-item active">실시간 현황</a>
          <a href="#stats" className="nav-item">인증 통계</a>
          
          <div className="menu-group">보안 분석</div>
          <a href="#captcha" className="nav-item">캡챠 분석</a>
          <a href="#behavior" className="nav-item">행동 분석</a>
          <a href="#attack" className="nav-item">공격 분석 <span className="badge">14</span></a>
          
          <div className="menu-group">관리</div>
          <a href="#manage" className="nav-item">캡챠 관리</a>
          <a href="#log" className="nav-item">로그 조회</a>
        </nav>

        <div className="sidebar-theme-toggle" onClick={() => setDarkMode(!darkMode)}>
          <span>{darkMode ? '🌙 다크모드' : '☀️ 라이트모드'}</span>
        </div>

        <div className="sidebar-footer">
          <div className="plan-info">
            <div className="plan-header">
              <span>API 사용량 - Pro</span>
            </div>
            <div className="plan-progress">
              <div className="progress-bar" style={{ width: '36.8%' }}></div>
            </div>
            <div className="plan-text">184,392 / 500,000</div>
          </div>
        </div>
      </aside>

      {/* 메인 콘텐츠 영역 */}
      <div className="main-wrapper">
        <main className="content-body">
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
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="time" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="success" stroke="#5da2ff" strokeWidth={2} name="정상 인증" />
                      <Line type="monotone" dataKey="attack" stroke="#ff5c5c" strokeWidth={2} name="차단된 공격" />
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
                        <Pie data={captchaPieData} innerRadius={50} outerRadius={70} paddingAngle={5} dataKey="value">
                          {captchaPieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
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
                  <h3>사용자 행동 패턴 (마우스 트랙)</h3>
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
                    <BarChart layout="vertical" data={attackTypeData} margin={{ left: 20, right: 20 }}>
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" tickLine={false} />
                      <Tooltip />
                      <Bar dataKey="value" fill="#ff5c5c" radius={[0, 4, 4, 0]} barSize={12} />
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