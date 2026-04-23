import React, { useState } from 'react';
import { message } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, EyeOutlined, EyeInvisibleOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../api/axios';

const LOCAL_BG_IMAGES = ['/auth-bg.jpg', '/auth-bg.jpeg', '/auth-bg.png', '/auth-bg.webp'];
const LOCAL_BG_FALLBACK = '/auth-bg.svg';

const HERO_SVG = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" width="900" height="900" viewBox="0 0 900 900">
    <defs>
      <radialGradient id="bg" cx="50%" cy="45%" r="70%">
        <stop offset="0" stop-color="#0b1220"/>
        <stop offset="0.75" stop-color="#070a12"/>
        <stop offset="1" stop-color="#050711"/>
      </radialGradient>
      <linearGradient id="g1" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#22d3ee"/>
        <stop offset="0.55" stop-color="#60a5fa"/>
        <stop offset="1" stop-color="#a78bfa"/>
      </linearGradient>
      <linearGradient id="g2" x1="1" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#22d3ee"/>
        <stop offset="1" stop-color="#a78bfa"/>
      </linearGradient>
      <filter id="glow" x="-40%" y="-40%" width="180%" height="180%">
        <feGaussianBlur stdDeviation="10" result="blur"/>
        <feColorMatrix
          in="blur"
          type="matrix"
          values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.9 0"
          result="glow"
        />
        <feMerge>
          <feMergeNode in="glow"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
    <rect width="900" height="900" rx="64" fill="url(#bg)"/>
    <g opacity="0.22">
      <circle cx="160" cy="720" r="220" fill="#22d3ee"/>
      <circle cx="760" cy="200" r="260" fill="#a78bfa"/>
    </g>
    <g fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="2">
      <path d="M80 450h740"/>
      <path d="M450 80v740"/>
      <path d="M148 148l604 604"/>
      <path d="M752 148L148 752"/>
    </g>
    <g filter="url(#glow)">
      <circle cx="450" cy="450" r="270" fill="none" stroke="url(#g1)" stroke-width="14" opacity="0.8"/>
      <circle cx="450" cy="450" r="200" fill="none" stroke="rgba(255,255,255,0.14)" stroke-width="10"/>
      <path d="M450 176l70 170-70 76-70-76z" fill="url(#g2)" opacity="0.95"/>
      <path d="M450 724l-70-170 70-76 70 76z" fill="url(#g1)" opacity="0.55"/>
      <circle cx="450" cy="450" r="18" fill="#e2e8f0" opacity="0.92"/>
      <circle cx="450" cy="450" r="7" fill="#22d3ee" opacity="0.95"/>
    </g>
  </svg>
`)}`;

const AUTH_BG_CANDIDATES = [
  ...LOCAL_BG_IMAGES,
  'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=2400&q=80',
  'https://images.unsplash.com/photo-1444703686981-a3abbc4d4fe3?auto=format&fit=crop&w=2400&q=80',
  'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=2400&q=80',
  'https://picsum.photos/id/1018/2400/1600',
  'https://picsum.photos/id/1015/2400/1600',
  'https://picsum.photos/id/1003/2400/1600',
];

const Register = () => {
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const navigate = useNavigate();

  const [bgIndex, setBgIndex] = useState(() => Math.floor(Math.random() * AUTH_BG_CANDIDATES.length));
  const [bgLoaded, setBgLoaded] = useState(false);
  const [bgAttempts, setBgAttempts] = useState(0);
  const bgEnabled = bgAttempts < AUTH_BG_CANDIDATES.length;
  const bgSrc = bgEnabled ? AUTH_BG_CANDIDATES[bgIndex] : null;

  const onBgError = () => {
    setBgLoaded(false);
    setBgAttempts((attempts) => {
      const next = attempts + 1;
      if (next >= AUTH_BG_CANDIDATES.length) return next;
      setBgIndex((idx) => (idx + 1) % AUTH_BG_CANDIDATES.length);
      return next;
    });
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    
    let hasError = false;
    const newErrors = {};
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    
    if (!trimmedName) {
      newErrors.name = 'Vui lòng nhập họ và tên';
      hasError = true;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!trimmedEmail) {
      newErrors.email = 'Vui lòng nhập email';
      hasError = true;
    } else if (!emailRegex.test(trimmedEmail)) {
      newErrors.email = 'Email không hợp lệ';
      hasError = true;
    }
    
    if (!password) {
      newErrors.password = 'Vui lòng nhập mật khẩu';
      hasError = true;
    } else if (password.length < 6) {
      newErrors.password = 'Mật khẩu phải ít nhất 6 ký tự';
      hasError = true;
    }
    
    if (confirm !== password) {
      newErrors.confirm = 'Mật khẩu xác nhận không khớp';
      hasError = true;
    }

    if (hasError) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/register', { name: trimmedName, email: trimmedEmail, password });
      message.success('Đăng ký tài khoản thành công! Vui lòng đăng nhập.');
      navigate('/login');
    } catch (err) {
      message.error(err.response?.data?.message || 'Có lỗi xảy ra khi đăng ký');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell min-h-screen bg-[#070a12] text-slate-100">
      <div className="relative min-h-screen lg:grid lg:grid-cols-2">
        <aside className="hidden lg:flex relative items-center justify-center overflow-hidden bg-[#070a12] px-10 py-14">
          <div className="absolute inset-0 bg-[radial-gradient(900px_600px_at_10%_10%,rgba(34,211,238,0.18),transparent_55%),radial-gradient(900px_600px_at_95%_15%,rgba(167,139,250,0.16),transparent_55%)]" />
          <div className="relative w-full max-w-md">
            <div className="rounded-[28px] border border-white/10 bg-white/5 backdrop-blur-2xl shadow-[0_30px_120px_rgba(0,0,0,0.55)] p-10">
              <div className="rounded-3xl border border-white/10 bg-black/25 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.03)_inset]">
                <img alt="Hero" src={HERO_SVG} className="h-56 w-full rounded-2xl object-cover" />
              </div>
              <div className="mt-8">
                <div className="text-3xl font-extrabold tracking-tight text-white">
                  CHÀO MỪNG
                </div>
                <div className="mt-3 text-sm leading-6 text-slate-200/80">
                  Tạo tài khoản mới để bắt đầu sử dụng hệ thống quản trị.
                </div>
              </div>
            </div>
          </div>
        </aside>

        <main className="relative flex items-center justify-center overflow-hidden px-6 py-12">
          <div className="absolute inset-0 -z-10">
            <img
              alt=""
              aria-hidden="true"
              src={LOCAL_BG_FALLBACK}
              decoding="async"
              loading="eager"
              className="absolute inset-0 h-full w-full object-cover opacity-100"
            />
            {bgSrc ? (
              <img
                alt=""
                aria-hidden="true"
                src={bgSrc}
                decoding="async"
                loading="eager"
                referrerPolicy="no-referrer"
                onLoad={() => setBgLoaded(true)}
                onError={onBgError}
                className={`absolute inset-0 h-full w-full object-cover saturate-110 contrast-105 brightness-105 transition-opacity duration-700 ${bgLoaded ? 'opacity-90' : 'opacity-0'}`}
              />
            ) : null}
            <div className={`absolute inset-0 bg-gradient-to-br ${bgLoaded ? 'from-black/18 via-slate-950/10 to-black/24' : 'from-black/28 via-slate-950/18 to-black/34'}`} />
            <div className="absolute inset-0 bg-[radial-gradient(1000px_700px_at_12%_0%,rgba(34,211,238,0.16),transparent_55%),radial-gradient(900px_650px_at_110%_10%,rgba(167,139,250,0.16),transparent_55%)]" />
          </div>

          <div className="w-full max-w-sm">
            <div className="rounded-[28px] border border-white/10 bg-slate-950/65 backdrop-blur-2xl shadow-[0_28px_100px_rgba(0,0,0,0.65)] p-8">
              <div className="text-center text-lg font-extrabold tracking-[0.18em] text-white">
                ĐĂNG KÝ
              </div>

              <form onSubmit={onSubmit} className="mt-7 space-y-4">
                <div>
                  <label className="mb-2 block text-xs font-semibold tracking-wide text-slate-200/85">
                    Họ và tên
                  </label>
                  <div className={`flex h-11 items-center gap-3 rounded-2xl border ${errors.name ? 'border-red-500/50' : 'border-white/10'} bg-black/25 px-3.5 transition focus-within:border-cyan-300/55 focus-within:shadow-[0_0_0_1px_rgba(34,211,238,0.24),0_0_0_6px_rgba(34,211,238,0.10)]`}>
                    <span className="text-[16px] leading-none text-slate-300/80">
                      <UserOutlined />
                    </span>
                    <input
                      value={name}
                      onChange={(e) => { setName(e.target.value); setErrors({...errors, name: null}); }}
                      type="text"
                      autoComplete="name"
                      placeholder="Họ và tên"
                      className="w-full flex-1 bg-transparent text-sm text-slate-100 placeholder:text-slate-400/60 outline-none"
                    />
                  </div>
                  {errors.name && <div className="mt-1.5 text-xs text-red-400">{errors.name}</div>}
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold tracking-wide text-slate-200/85">
                    Email
                  </label>
                  <div className={`flex h-11 items-center gap-3 rounded-2xl border ${errors.email ? 'border-red-500/50' : 'border-white/10'} bg-black/25 px-3.5 transition focus-within:border-cyan-300/55 focus-within:shadow-[0_0_0_1px_rgba(34,211,238,0.24),0_0_0_6px_rgba(34,211,238,0.10)]`}>
                    <span className="text-[16px] leading-none text-slate-300/80">
                      <MailOutlined />
                    </span>
                    <input
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setErrors({...errors, email: null}); }}
                      type="email"
                      autoComplete="email"
                      placeholder="Email"
                      className="w-full flex-1 bg-transparent text-sm text-slate-100 placeholder:text-slate-400/60 outline-none"
                    />
                  </div>
                  {errors.email && <div className="mt-1.5 text-xs text-red-400">{errors.email}</div>}
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold tracking-wide text-slate-200/85">
                    Mật khẩu
                  </label>
                  <div className={`flex h-11 items-center gap-3 rounded-2xl border ${errors.password ? 'border-red-500/50' : 'border-white/10'} bg-black/25 px-3.5 transition focus-within:border-white/18 focus-within:shadow-[0_0_0_1px_rgba(255,255,255,0.10)]`}>
                    <span className="text-[16px] leading-none text-slate-300/80">
                      <LockOutlined />
                    </span>
                    <input
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setErrors({...errors, password: null}); }}
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      placeholder="Mật khẩu (tối thiểu 6 ký tự)"
                      className="w-full flex-1 bg-transparent text-sm text-slate-100 placeholder:text-slate-400/60 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="grid h-9 w-9 place-items-center rounded-xl border border-transparent text-slate-300/80 transition hover:border-white/10 hover:bg-white/5 hover:text-slate-100"
                      aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    >
                      {showPassword ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                    </button>
                  </div>
                  {errors.password && <div className="mt-1.5 text-xs text-red-400">{errors.password}</div>}
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold tracking-wide text-slate-200/85">
                    Xác nhận mật khẩu
                  </label>
                  <div className={`flex h-11 items-center gap-3 rounded-2xl border ${errors.confirm ? 'border-red-500/50' : 'border-white/10'} bg-black/25 px-3.5 transition focus-within:border-white/18 focus-within:shadow-[0_0_0_1px_rgba(255,255,255,0.10)]`}>
                    <span className="text-[16px] leading-none text-slate-300/80">
                      <LockOutlined />
                    </span>
                    <input
                      value={confirm}
                      onChange={(e) => { setConfirm(e.target.value); setErrors({...errors, confirm: null}); }}
                      type={showConfirm ? 'text' : 'password'}
                      autoComplete="new-password"
                      placeholder="Nhập lại mật khẩu"
                      className="w-full flex-1 bg-transparent text-sm text-slate-100 placeholder:text-slate-400/60 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((v) => !v)}
                      className="grid h-9 w-9 place-items-center rounded-xl border border-transparent text-slate-300/80 transition hover:border-white/10 hover:bg-white/5 hover:text-slate-100"
                      aria-label={showConfirm ? 'Ẩn mật khẩu xác nhận' : 'Hiện mật khẩu xác nhận'}
                    >
                      {showConfirm ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                    </button>
                  </div>
                  {errors.confirm && <div className="mt-1.5 text-xs text-red-400">{errors.confirm}</div>}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-1 w-full h-11 rounded-2xl bg-gradient-to-r from-cyan-400 to-sky-500 text-slate-950 font-extrabold tracking-wide transition hover:brightness-110 hover:shadow-[0_16px_60px_rgba(34,211,238,0.25)] focus:outline-none focus:ring-4 focus:ring-cyan-400/20 disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.99]"
                >
                  {loading ? 'ĐANG TẠO TÀI KHOẢN...' : 'TRUY CẬP NGAY'}
                </button>
              </form>

              <div className="mt-6 text-center text-sm text-slate-300/85">
                Đã có tài khoản?{' '}
                <Link to="/login" className="font-semibold text-cyan-300 hover:text-cyan-200 hover:underline underline-offset-4 transition-colors">
                  Đăng nhập
                </Link>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Register;
