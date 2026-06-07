import React, { createContext, useState, useEffect, useContext } from "react";
import axios from "axios";

const api = axios.create({ baseURL: "https://agami-captcha.cloud", withCredentials: true });
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/auth/me");
      const userData = res.data.user;

      // [추가된 로직] 프로필 이미지가 존재할 경우, http를 https로 중앙에서 강제 변환
      if (userData && userData.profile) {
        userData.profile = userData.profile.replace('http://', 'https://');
      }

      setUser(userData); // 정제된 안전한 데이터를 전역 상태로 저장
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { checkAuth(); }, []);

  return <AuthContext.Provider value={{ user, loading, checkAuth, setUser }}>{children}</AuthContext.Provider>;
};
export const useAuth = () => useContext(AuthContext);