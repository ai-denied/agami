import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "@/contexts/AuthContext";
import "./Settings.css";

const api = axios.create({ baseURL: "https://agami-captcha.cloud", withCredentials: true });

const Settings = () => {
  const { user, setUser } = useAuth();
  const [nickname, setNickname] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: "", type: "" });

  useEffect(() => {
    if (user) {
      setNickname(user.nickname || "");
    }
  }, [user]);

  const showNotification = (message, type = "success") => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: "", type: "" }), 3000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (nickname === user?.nickname) {
      showNotification("변경된 닉네임이 없습니다.", "error");
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await api.patch("/api/auth/me", { nickname });
      if (response.data.status === "success") {
        showNotification("닉네임이 성공적으로 업데이트되었습니다.");
        setUser(response.data.user);
      }
    } catch (error) {
      console.error("프로필 업데이트 실패:", error);
      showNotification("닉네임 변경 중 오류가 발생했습니다.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 플랜별 설명 매핑
  const planNames = {
    Basic: "Basic (월 1,000회 무료)",
    Pro: "Pro (월 100,000회)",
    Enterprise: "Enterprise (무제한)"
  };

  return (
    <div className="settings-page-wrapper">
      <div className="settings-container">
        <header className="settings-header">
          <h1 className="settings-title">계정 설정</h1>
          <p className="settings-description">플랫폼에서 사용될 닉네임, 요금제를 관리합니다.</p>
        </header>

        <section className="settings-section">
          <h2 className="section-label">기본 정보</h2>
          <form className="nickname-form" onSubmit={handleSubmit}>
            <div className="form-group profile-readonly-group">
              <label className="form-label">프로필 사진</label>
              <div className="image-preview-wrapper">
                <img 
                  src={user?.profile || "/agami-profile.png"} 
                  alt="Profile" 
                  className="settings-profile-img"
                  onError={(e) => { e.target.src = "/agami-profile.png"; }}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="nickname" className="form-label">닉네임</label>
              <input 
                type="text" 
                id="nickname" 
                className="form-input" 
                value={nickname} 
                onChange={(e) => setNickname(e.target.value)} 
                placeholder="새로운 닉네임을 입력하세요"
                required
                maxLength={20}
              />
            </div>

            <div className="form-actions">
              {notification.show && (
                <span className={`notification-msg ${notification.type}`}>
                  {notification.message}
                </span>
              )}
              <button type="submit" className="btn-submit" disabled={isSubmitting}>
                {isSubmitting ? "저장 중..." : "변경사항 저장"}
              </button>
            </div>
          </form>
        </section>

        <hr className="divider" />

        <section className="settings-section">
          <h2 className="section-label">구독 정보</h2>
          <div className="plan-info-box">
            <span className="plan-label">현재 이용 중인 요금제</span>
            <span className="plan-value">{planNames[user?.plan || "Basic"]}</span>
            <button 
              className="btn-outline-primary" 
              onClick={() => window.location.href = '/price'}
            >
              요금제 변경
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Settings;