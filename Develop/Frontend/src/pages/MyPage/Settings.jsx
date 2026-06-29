import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "@/contexts/AuthContext";
import "./Settings.css";
import Scrollbar from "@/components/Scrollbar/Scrollbar";

const api = axios.create({ baseURL: "https://agami-captcha.cloud", withCredentials: true });

const Settings = () => {
  const { user, setUser } = useAuth();
  const [nickname, setNickname] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [notification, setNotification] = useState({ show: false, message: "", type: "" });
  
  // 💡 회원탈퇴 확인용 모달 상태 추가
  const [confirmModal, setConfirmModal] = useState({ show: false, message: "", onConfirm: null });

  useEffect(() => {
    if (user) {
      setNickname(user.nickname || "");
    }
  }, [user]);

  const showNotification = (message, type = "success") => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: "", type: "" }), 3000);
  };

  const closeConfirm = () => setConfirmModal({ show: false, message: "", onConfirm: null });

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

  // 💡 회원 탈퇴 처리 핸들러
  const handleDeleteAccount = () => {
    setConfirmModal({
      show: true,
      message: "정말로 회원 탈퇴를 진행하시겠습니까?\n모든 프로젝트와 로그 데이터가 영구적으로 삭제되며, 복구할 수 없습니다.",
      onConfirm: async () => {
        closeConfirm();
        try {
          const response = await api.delete("/api/auth/me");
          if (response.data.status === "success") {
            setUser(null); // 클라이언트 유저 정보 초기화
            window.location.href = "/"; // 메인 홈으로 리다이렉트
          }
        } catch (error) {
          console.error(error);
          showNotification("회원 탈퇴 처리 중 오류가 발생했습니다.", "error");
        }
      }
    });
  };

  // 플랜별 설명 매핑
  const planNames = {
    Basic: "Basic (월 1,000회 무료)",
    Pro: "Pro (월 100,000회)",
    Enterprise: "Enterprise (무제한)"
  };

  return (
    <Scrollbar className="settings-page-wrapper">
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

        <hr className="divider" />

        {/* 💡 회원 탈퇴 (위험 구역) 섹션 추가 */}
        <section className="settings-section">
          <h2 className="section-label" style={{ color: "var(--danger-color, #ef4444)" }}>위험 구역</h2>
          <div className="danger-zone-box">
            <div className="danger-info">
              <span className="danger-label">회원 탈퇴</span>
              <p className="danger-desc">계정을 삭제하면 등록된 모든 프로젝트와 데이터가 영구적으로 파기됩니다.</p>
            </div>
            <button type="button" className="btn-danger-outline" onClick={handleDeleteAccount}>
              회원 탈퇴
            </button>
          </div>
        </section>
      </div>

      {/* 💡 재확인 커스텀 모달 (ProjectDetail과 스타일 공유) */}
      {confirmModal.show && (
        <div className="custom-sys-modal-overlay" onClick={closeConfirm}>
          <div className="custom-sys-modal-box" onClick={e => e.stopPropagation()}>
            <div className="custom-sys-modal-text">{confirmModal.message}</div>
            <div className="custom-sys-modal-actions">
              <button className="btn-sys-cancel" onClick={closeConfirm}>취소</button>
              <button className="btn-sys-danger" onClick={confirmModal.onConfirm}>탈퇴</button>
            </div>
          </div>
        </div>
      )}
    </Scrollbar>
  );
};

export default Settings;