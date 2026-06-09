import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { useAuth } from "@/contexts/AuthContext";
import "./Settings.css";

const api = axios.create({ baseURL: "https://agami-captcha.cloud", withCredentials: true });

const Settings = () => {
  const { user, setUser } = useAuth();
  const [nickname, setNickname] = useState("");
  const [previewImage, setPreviewImage] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  // 초기 유저 정보 로드
  useEffect(() => {
    if (user) {
      setNickname(user.nickname || "");
      setPreviewImage(user.profile || "/default-profile.png");
    }
  }, [user]);

  // 이미지 파일 선택 핸들러
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      // 로컬 미리보기 생성
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // 프로필 업데이트 제출 핸들러
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData();
    if (nickname !== user.nickname) {
      formData.append("nickname", nickname);
    }
    if (selectedFile) {
      formData.append("profile_image", selectedFile);
    }

    // 변경사항이 없으면 조기 종료
    if (!formData.has("nickname") && !formData.has("profile_image")) {
      alert("변경된 내용이 없습니다.");
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await api.patch("/api/auth/me", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.data.status === "success") {
        alert("프로필이 성공적으로 업데이트되었습니다.");
        setUser(response.data.user); // 전역 유저 상태 갱신
        setSelectedFile(null);
      }
    } catch (error) {
      console.error("프로필 업데이트 실패:", error);
      alert("프로필 업데이트 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="settings-container">
      <h1 className="settings-title">계정 설정</h1>
      <p className="settings-description">플랫폼에서 사용될 프로필과 닉네임을 관리할 수 있습니다.</p>

      <form className="settings-form" onSubmit={handleSubmit}>
        {/* 프로필 이미지 수정 영역 */}
        <div className="form-group image-upload-group">
          <label className="form-label">프로필 사진</label>
          <div className="image-preview-wrapper">
            <img 
              src={previewImage} 
              alt="Profile Preview" 
              className="settings-profile-img"
              onError={(e) => { e.target.src = "/default-profile.png"; }}
            />
            <div className="image-actions">
              <button 
                type="button" 
                className="btn-change-image"
                onClick={() => fileInputRef.current.click()}
              >
                이미지 변경
              </button>
              <input 
                type="file" 
                accept="image/*" 
                ref={fileInputRef} 
                onChange={handleImageChange} 
                style={{ display: "none" }} 
              />
            </div>
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

        {/* 저장 버튼 */}
        <div className="form-actions">
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