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

  // 자체 UI 알림 함수
  const showNotification = (message, type = "success") => {
    setNotification({ show: true, message, type });
    // 3초 후 메시지 자동 숨김
    setTimeout(() => {
      setNotification({ show: false, message: "", type: "" });
    }, 3000);
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
      // JSON 페이로드 전송
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

  return (
    <div className="settings-container">
      <h1 className="settings-title">계정 설정</h1>
      <p className="settings-description">플랫폼에서 사용될 프로필과 닉네임을 관리할 수 있습니다.</p>

      <form className="settings-form" onSubmit={handleSubmit}>
        {/* 읽기 전용 프로필 이미지 */}
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

        {/* 닉네임 수정 영역 */}
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

        {/* 저장 버튼 및 알림 메시지 영역 */}
        <div className="form-actions">
          {notification.show && (
            <span className={`notification-msg ${notification.type}`}>
              {notification.message}
            </span>
          )}
          <button 
            type="submit" 
            className="btn-submit" 
            disabled={isSubmitting}
          >
            {isSubmitting ? "저장 중..." : "변경사항 저장"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Settings;