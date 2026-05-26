'use client';import { useState, useEffect, useCallback, useRef } from 'react';import { RefreshCw, Loader2, CheckCircle, AlertCircle, Terminal, Clock, Globe, ToggleLeft, ToggleRight, Package, CloudDownload, Server } from 'lucide-react';

interface UpdateStatus {
  currentVersion: string;
  updateConfigured: boolean;
  updateVersionUrl: string;
  updateZipUrl: string;
  lastCheck: string | null;
  latestAvailableVersion: string | null;
  autoUpdateEnabled: boolean;
  autoUpdateIntervalMinutes: number;
  updateSuccessVersion: string | null;
}

export default function AdminUpdatePage() {
  const [status, setStatus] = useState<UpdateStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [hasUpdate, setHasUpdate] = useState(false);
  const [log, setLog] = useState<string[]>([]);
  const [overlay, setOverlay] = useState<{ show: boolean; step: string }>({ show: false, step: '' });
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/update');
      const data = await res.json();
      if (res.ok) {
        setStatus(data);
        if (data.updateSuccessVersion) {
          setLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] Cập nhật thành công lên v${data.updateSuccessVersion}! Server đã khởi động lại.`]);
          setMessage({ type: 'success', text: `Cập nhật thành công lên v${data.updateSuccessVersion}!` });
        }
        if (data.latestAvailableVersion) {
          setHasUpdate(compareVersion(data.latestAvailableVersion, data.currentVersion) > 0);
        }
      }
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);

  // Cleanup poll on unmount
  useEffect(() => {
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  const compareVersion = (a: string, b: string) => {
    const pa = a.replace(/^v/, '').split('.').map(Number);
    const pb = b.replace(/^v/, '').split('.').map(Number);
    for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
      const na = pa[i] || 0, nb = pb[i] || 0;
      if (na > nb) return 1;
      if (na < nb) return -1;
    }
    return 0;
  };

  const handleCheck = async () => {
    setChecking(true); setMessage(null);
    setLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] Đang kiểm tra phiên bản...`]);
    try {
      const res = await fetch('/api/admin/update/check', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setHasUpdate(data.hasUpdate);
        setStatus(prev => prev ? { ...prev, latestAvailableVersion: data.latestVersion, lastCheck: data.checkedAt } : prev);
        if (data.hasUpdate) {
          setMessage({ type: 'success', text: `Phiên bản mới ${data.latestVersion} có sẵn!` });
          setLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] Tìm thấy bản mới: ${data.latestVersion} (hiện tại: ${data.currentVersion})`]);
        } else {
          setMessage({ type: 'success', text: `Đang ở phiên bản mới nhất (${data.currentVersion})` });
          setLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] Đã là phiên bản mới nhất (${data.currentVersion})`]);
        }
      } else {
        setMessage({ type: 'error', text: data.error || 'Kiểm tra thất bại' });
        setLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] LỖI: ${data.error}`]);
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
      setLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] Lỗi kết nối: ${err.message}`]);
    } finally { setChecking(false); }
  };

  const handleUpdate = async () => {
    setUpdating(true); setMessage(null);
    setOverlay({ show: true, step: 'Đang tải bản cập nhật...' });
    setLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] Bắt đầu cập nhật...`]);
    try {
      const res = await fetch('/api/admin/update', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setOverlay({ show: true, step: 'Giải nén & cài đặt...' });
        setLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${data.message}`]);
        if (data.latestVersion) setHasUpdate(false);

        // Poll server restart
        setTimeout(() => {
          setOverlay({ show: true, step: 'Server đang khởi động lại...' });
          let attempts = 0;
          pollRef.current = setInterval(async () => {
            attempts++;
            try {
              const healthRes = await fetch('/api/admin/update');
              if (healthRes.ok) {
                const healthData = await healthRes.json();
                clearInterval(pollRef.current!);
                pollRef.current = null;
                setOverlay({ show: false, step: '' });
                setLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] Server đã khởi động lại thành công!`]);
                setMessage({ type: 'success', text: `Đã cập nhật lên v${healthData.currentVersion}!` });
                // Auto-refresh after 2s
                setTimeout(() => { window.location.reload(); }, 2000);
              }
            } catch {}
            if (attempts > 60) {
              clearInterval(pollRef.current!);
              pollRef.current = null;
              setOverlay({ show: false, step: '' });
              setUpdating(false);
              setMessage({ type: 'success', text: 'Cập nhật hoàn tất! Vui lòng F5 để tải lại trang.' });
            }
          }, 3000);
        }, 1000);
      } else {
        setOverlay({ show: false, step: '' });
        setMessage({ type: 'error', text: data.message || data.error || 'Cập nhật thất bại' });
        setLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] LỖI: ${data.message || data.error}`]);
        setUpdating(false);
      }
    } catch (err: any) {
      setOverlay({ show: false, step: '' });
      setMessage({ type: 'error', text: err.message });
      setLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] Lỗi kết nối: ${err.message}`]);
      setUpdating(false);
    }
  };

  const toggleAutoUpdate = async () => {
    if (!status) return;
    const newVal = !status.autoUpdateEnabled;
    try {
      await fetch('/api/admin/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ settings: { auto_update_enabled: String(newVal) } }) });
      setStatus({ ...status, autoUpdateEnabled: newVal });
    } catch {}
  };

  const updateInterval = async (minutes: number) => {
    if (!status) return;
    try {
      await fetch('/api/admin/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ settings: { auto_update_interval_minutes: String(minutes) } }) });
      setStatus({ ...status, autoUpdateIntervalMinutes: minutes });
    } catch {}
  };

  if (loading) return (<div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-[var(--primary)]" /></div>);

  const formatTime = (iso: string | null) => {
    if (!iso) return 'Chưa kiểm tra';
    return new Date(iso).toLocaleString('vi-VN');
  };

  const hasConfig = status?.updateConfigured;

  return (
    <>
      {/* Update progress overlay */}
      {overlay.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="rounded-2xl border border-divider bg-card p-8 max-w-md w-full mx-4 text-center shadow-2xl">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--primary)]/10">
              <Loader2 className="h-8 w-8 animate-spin text-[var(--primary)]" />
            </div>
            <h3 className="text-xl font-bold text-main mb-2">Đang cập nhật hệ thống</h3>
            <div className="flex items-center justify-center gap-2 mb-4">
              <Server className="h-4 w-4 text-[var(--primary)]" />
              <p className="text-sm text-muted">{overlay.step}</p>
            </div>
            <div className="w-full bg-hover rounded-full h-2 mb-4 overflow-hidden">
              <div className="h-full bg-[var(--primary)] rounded-full animate-pulse" style={{ width: '60%' }} />
            </div>
            <p className="text-xs text-muted">Server sẽ tự động khởi động lại. Trang sẽ tự tải lại sau khi hoàn tất.</p>
          </div>
        </div>
      )}

      <div className="min-h-screen px-4 py-8 sm:px-6 lg:px-8 text-main">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold gradient-heading">Cập nhật hệ thống</h1>
          <p className="mt-2 text-sm text-muted">Tự động cập nhật code từ GitHub Private Repo</p>
        </div>

        {message && (
          <div className={`mb-6 rounded-xl p-4 flex items-center gap-3 ${message.type === 'success' ? 'bg-[var(--success)]/10 border border-[var(--success)]/20' : 'bg-[var(--danger)]/10 border border-[var(--danger)]/20'}`}>
            {message.type === 'success' ? <CheckCircle className="h-5 w-5 text-[var(--success)] shrink-0" /> : <AlertCircle className="h-5 w-5 text-[var(--danger)] shrink-0" />}
            <p className={`text-sm ${message.type === 'success' ? 'text-[var(--success)]' : 'text-[var(--danger)]'}`}>{message.text}</p>
          </div>
        )}

        {/* Phiên bản */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="rounded-2xl border border-divider bg-card p-5">
            <div className="flex items-center gap-2 text-muted text-xs font-medium mb-2"><Package className="h-4 w-4" />Phiên bản hiện tại</div>
            <p className="text-3xl font-extrabold text-main">{status?.currentVersion || '0.0.0'}</p>
          </div>
          <div className="rounded-2xl border border-divider bg-card p-5">
            <div className="flex items-center gap-2 text-muted text-xs font-medium mb-2"><CloudDownload className="h-4 w-4" />Phiên bản mới nhất</div>
            <p className={`text-3xl font-extrabold ${hasUpdate ? 'text-[var(--success)]' : 'text-muted'}`}>
              {status?.latestAvailableVersion || '---'}
            </p>
            {hasUpdate && <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-[var(--success)]/10 px-2.5 py-0.5 text-xs font-medium text-[var(--success)]"><CheckCircle className="h-3 w-3" />Có bản cập nhật mới</span>}
          </div>
          <div className="rounded-2xl border border-divider bg-card p-5">
            <div className="flex items-center gap-2 text-muted text-xs font-medium mb-2"><Clock className="h-4 w-4" />Kiểm tra lần cuối</div>
            <p className="text-sm font-medium text-main">{formatTime(status?.lastCheck || null)}</p>
          </div>
          <div className="rounded-2xl border border-divider bg-card p-5">
            <div className="flex items-center gap-2 text-muted text-xs font-medium mb-2"><Globe className="h-4 w-4" />Nguồn cập nhật</div>
            <p className={`text-sm font-medium ${hasConfig ? 'text-[var(--success)]' : 'text-[var(--danger)]'}`}>
              {hasConfig ? 'Đã cấu hình' : 'Chưa cấu hình'}
            </p>
          </div>
        </div>

        {/* Hướng dẫn cấu hình */}
        {!hasConfig && (
          <div className="rounded-2xl border border-[var(--warning)]/20 bg-[var(--warning)]/5 p-6 mb-6">
            <h2 className="text-lg font-bold text-[var(--warning)] mb-2">Chưa cấu hình nguồn cập nhật</h2>
            <p className="text-sm text-muted mb-3">Vào <a href="/admin/settings" className="text-[var(--primary)] underline font-medium">Admin → Cài đặt → tab Cập nhật</a> để nhập URL cập nhật.</p>
            <p className="text-xs text-muted">Hoặc thêm vào <code className="bg-hover px-1 rounded">.env</code> trên server:
            <code className="block mt-1 bg-hover rounded p-2 text-xs font-mono text-main">
UPDATE_VERSION_URL=https://&lt;PAT&gt;@raw.githubusercontent.com/{'{owner}'}/{'{repo}'}/main/version.txt{'\n'}
UPDATE_ZIP_URL=https://&lt;PAT&gt;@raw.githubusercontent.com/{'{owner}'}/{'{repo}'}/main/update.zip</code>
            </p>
          </div>
        )}

        {/* Auto Update + Nút */}
        <div className="rounded-2xl border border-divider bg-card p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold text-main">Tự động kiểm tra</h2>
                  <p className="text-xs text-muted">Tự động kiểm tra phiên bản mới định kỳ</p>
                </div>
                <button onClick={toggleAutoUpdate} className="text-[var(--primary)] hover:opacity-80 transition">
                  {status?.autoUpdateEnabled ? <ToggleRight className="h-8 w-8" /> : <ToggleLeft className="h-8 w-8 text-muted" />}
                </button>
              </div>
              {status?.autoUpdateEnabled && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted">Kiểm tra mỗi</span>
                  <select value={status.autoUpdateIntervalMinutes} onChange={(e) => updateInterval(parseInt(e.target.value))}
                    className="rounded-lg border border-divider bg-main px-3 py-1.5 text-sm text-main focus:outline-none">
                    <option value="60">1 giờ</option>
                    <option value="360">6 giờ</option>
                    <option value="720">12 giờ</option>
                    <option value="1440">24 giờ</option>
                  </select>
                </div>
              )}
            </div>
            <div className="flex items-end gap-3 justify-end">
              <button onClick={handleCheck} disabled={checking}
                className="flex items-center gap-2 rounded-xl border border-divider bg-main px-5 py-3 text-sm font-semibold text-main hover:bg-hover transition disabled:opacity-50">
                {checking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Globe className="h-4 w-4" />}
                {checking ? 'Đang kiểm tra...' : 'Kiểm tra phiên bản'}
              </button>
              <button onClick={handleUpdate} disabled={updating || !hasUpdate}
                className="flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-content shadow-lg transition hover:bg-primary disabled:opacity-50 disabled:cursor-not-allowed">
                {updating ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                {updating ? 'Đang cập nhật...' : 'Cập nhật ngay'}
              </button>
            </div>
          </div>
        </div>

        {/* Log */}
        <div className="rounded-2xl border border-divider bg-card overflow-hidden">
          <div className="flex items-center gap-2 border-b border-divider px-5 py-3">
            <Terminal className="h-4 w-4 text-muted" />
            <span className="text-sm font-semibold text-main">Nhật ký</span>
          </div>
          <div className="p-4 max-h-80 overflow-y-auto font-mono text-xs">
            {log.length === 0 ? (
              <p className="text-muted">Chưa có hoạt động nào.</p>
            ) : (
              log.map((line, i) => (<div key={i} className="py-0.5 text-muted">{line}</div>))
            )}
          </div>
        </div>
      </div>
    </>
  );
}
