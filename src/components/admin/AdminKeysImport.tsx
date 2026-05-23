'use client';
import { useState, useRef, useMemo } from 'react';
import { Upload, Loader2, CheckCircle, XCircle, FileText, Eye, AlertTriangle, Search, X } from 'lucide-react';

interface Product { id: string; name: string; categoryId: string | null }
interface Category { id: string; name: string }
interface ParsedKey { keyValue: string; isDuplicate: boolean }
interface ParseResult { total: number; valid: ParsedKey[]; duplicates: ParsedKey[] }

export default function AdminKeysImport({
  products,
  categories,
}: {
  products: Product[]
  categories: Category[]
}) {
  const [selectedProductId, setSelectedProductId] = useState('');
  const [textInput, setTextInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ type: 'success' | 'error'; message: string; count?: number } | null>(null);
  const [parsedResult, setParsedResult] = useState<ParseResult | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = !selectedCategoryId || p.categoryId === selectedCategoryId;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchTerm, selectedCategoryId]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith('.txt')) {
      setResult({ type: 'error', message: 'Ch\u1EC9 ch\u1EA5p nh\u1EADn file .txt' });
      return;
    }
    const text = await file.text();
    setTextInput(text);
    setResult({ type: 'success', message: `\u0110\u00E3 \u0111\u1ECDc file: ${file.name}` });
  };

  const handleParseKeys = async () => {
    if (!selectedProductId) {
      setResult({ type: 'error', message: 'Vui l\u00F2ng ch\u1ECDn s\u1EA3n ph\u1EA9m' });
      return;
    }
    const keys = textInput
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    if (keys.length === 0) {
      setResult({ type: 'error', message: 'Kh\u00F4ng c\u00F3 key n\u00E0o h\u1EE3p l\u1EC7' });
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const response = await fetch('/api/admin/parse-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: selectedProductId, keys }),
      });
      const data = await response.json();
      if (!response.ok) {
        setResult({ type: 'error', message: data.error || 'Parse th\u1EA5t b\u1EA1i' });
        return;
      }
      setParsedResult(data.parsed);
      setShowPreview(true);
    } catch {
      setResult({ type: 'error', message: 'Kh\u00F4ng th\u1EC3 k\u1EBFt n\u1ED1i \u0111\u1EBFn m\u00E1y ch\u1EE7' });
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!parsedResult) return;
    const validKeys = parsedResult.valid.filter((k) => !k.isDuplicate).map((k) => k.keyValue);
    if (validKeys.length === 0) {
      setResult({ type: 'error', message: 'T\u1EA5t c\u1EA3 key \u0111\u00E3 t\u1ED3n t\u1EA1i trong kho' });
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const response = await fetch('/api/admin/import-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: selectedProductId, keys: validKeys }),
      });
      const data = await response.json();
      if (!response.ok) {
        setResult({ type: 'error', message: data.error || 'Import th\u1EA5t b\u1EA1i' });
        return;
      }
      setResult({
        type: 'success',
        message: `Import th\u00E0nh c\u00F4ng ${data.importedCount} key m\u1EDBi!`,
        count: data.importedCount,
      });
      setTextInput('');
      setParsedResult(null);
      setShowPreview(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch {
      setResult({ type: 'error', message: 'Kh\u00F4ng th\u1EC3 k\u1EBFt n\u1ED1i \u0111\u1EBFn m\u00E1y ch\u1EE7' });
    } finally {
      setLoading(false);
    }
  };

  const keyCount = textInput
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0).length;

  return (
    <div className="min-h-screen px-4 py-8 sm:px-6 lg:px-8 text-main">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold gradient-heading">
          Nhập Kho Key
        </h1>
        <p className="mt-2 text-sm text-muted">
          Upload hoặc nhập key thủ công, xem trước và xác nhận trước khi import
        </p>
      </div>
      <div className="mx-auto max-w-4xl">
        <div className="rounded-2xl border border-divider bg-card p-6 shadow-xl">
          {/* Product Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-muted mb-2">
              Chọn sản phẩm *
            </label>

            {/* Search + Category Filter */}
            <div className="flex flex-col sm:flex-row gap-3 mb-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Tìm kiếm sản phẩm..."
                  className="w-full rounded-lg bg-main border border-divider pl-9 pr-8 py-2.5 text-sm text-main placeholder-muted focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-main transition"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <select
                value={selectedCategoryId}
                onChange={(e) => setSelectedCategoryId(e.target.value)}
                className="w-full sm:w-48 rounded-lg bg-main border border-divider px-3 py-2.5 text-sm text-main focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
              >
                <option value="">Tất cả danh mục</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="w-full rounded-lg bg-main border border-divider px-3 py-2.5 text-sm text-main focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
            >
              <option value="">-- Chọn sản phẩm --</option>
              {filteredProducts.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </select>
            {searchTerm && filteredProducts.length === 0 && (
              <p className="mt-2 text-xs text-muted">Không tìm thấy sản phẩm phù hợp</p>
            )}
          </div>

          {/* File Upload */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-muted mb-2">
              Upload file .txt (mỗi dòng là 1 key)
            </label>
            <div
              className="rounded-lg border-2 border-dashed border-divider p-8 text-center transition hover:border-[var(--primary)]/40 cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="mx-auto h-10 w-10 text-[var(--primary)]" />
              <p className="mt-3 text-sm text-muted">
                <span className="font-medium text-[var(--primary)]">Click để chọn file</span>
                {' '}hoặc kéo thả file vào đây
              </p>
              <p className="mt-1 text-xs text-muted">
                Hỗ trợ file .txt, mỗi dòng chứa 1 key
              </p>
              <input
                ref={fileInputRef} type="file"
                accept=".txt"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          </div>

          {/* Textarea */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-muted mb-2">
              Hoặc nhập key trực tiếp
            </label>
            <textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              rows={10}
              placeholder={"Nhập mỗi key trên một dòng:\nXXXXX-XXXXX-XXXXX-XXXXX\nYYYYY-YYYYY-YYYYY-YYYYY"}
              className="w-full rounded-lg bg-main border border-divider px-3 py-2 font-mono text-sm text-main placeholder-muted focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
            />
            <div className="mt-2 flex items-center gap-2 text-xs text-muted">
              <FileText className="h-3.5 w-3.5" />
              <span>{keyCount} key hợp lệ</span>
            </div>
          </div>

          {/* Result Message */}
          {result && (
            <div
              className={`mb-4 flex items-start gap-3 rounded-lg p-4 ${
                result.type === 'success'
                  ? 'bg-[var(--success)]/10 text-[var(--success)] border border-[var(--success)]/20'
                  : 'bg-[var(--danger)]/10 text-[var(--danger)] border border-[var(--danger)]/20'
              }`}
            >
              {result.type === 'success' ? (
                <CheckCircle className="mt-0.5 h-5 w-5 shrink-0" />
              ) : (
                <XCircle className="mt-0.5 h-5 w-5 shrink-0" />
              )}
              <div>
                <p className="font-medium">{result.message}</p>
              </div>
            </div>
          )}

          {/* Parse Button */}
          <button
            onClick={handleParseKeys}
            disabled={loading || !selectedProductId || keyCount === 0}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-base font-semibold text-primary-content transition hover:bg-primary disabled:cursor-not-allowed disabled:opacity-50 mb-4"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Đang phân tích...
              </>
            ) : (
              <>
                <Eye className="h-5 w-5" />
                Xem trước {keyCount} key
              </>
            )}
          </button>

          {/* Preview Modal */}
          {showPreview && parsedResult && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
              <div className="w-full max-w-3xl rounded-2xl border border-divider bg-card shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
                <div className="flex items-center justify-between p-6 border-b border-divider">
                  <div>
                    <h2 className="text-xl font-bold text-main">Xem trước key</h2>
                    <p className="text-sm text-muted mt-1">
                      {parsedResult.valid.length} key mới, {parsedResult.duplicates.length} key trùng
                    </p>
                  </div>
                  <button
                    onClick={() => setShowPreview(false)}
                    className="text-muted hover:text-main transition"
                  >
                    <XCircle className="h-5 w-5" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-6">
                  {parsedResult.duplicates.length > 0 && (
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-2 text-[var(--warning)]">
                        <AlertTriangle className="h-4 w-4" />
                        <span className="text-sm font-medium">Key trùng ({parsedResult.duplicates.length})</span>
                      </div>
                      <div className="space-y-1">
                        {parsedResult.duplicates.map((key, idx) => (
                          <div key={idx} className="flex items-center gap-2 rounded bg-[var(--warning)]/5 border border-[var(--warning)]/10 px-3 py-2">
                            <span className="font-mono text-xs text-[var(--warning)]">{key.keyValue}</span>
                            <span className="text-[10px] text-[var(--warning)] ml-auto">Trùng</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2 mb-2 text-[var(--success)]">
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-sm font-medium">Key mới ({parsedResult.valid.length})</span>
                    </div>
                    <div className="space-y-1 max-h-64 overflow-y-auto">
                      {parsedResult.valid.map((key, idx) => (
                        <div key={idx} className="flex items-center gap-2 rounded bg-[var(--success)]/5 border border-[var(--success)]/10 px-3 py-2">
                          <CheckCircle className="h-3 w-3 text-[var(--success)]" />
                          <span className="font-mono text-xs text-[var(--success)]">{key.keyValue}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="border-t border-divider p-6 flex gap-3">
                  <button
                    onClick={() => setShowPreview(false)}
                    className="flex-1 rounded-lg bg-card px-4 py-2.5 text-sm font-medium text-muted transition hover:bg-hover"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handleConfirmImport}
                    disabled={loading || parsedResult.valid.length === 0}
                    className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-content transition hover:bg-primary disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="inline h-4 w-4 animate-spin mr-1" />
                        Đang import...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="inline h-4 w-4 mr-1" />
                        Import {parsedResult.valid.length} key mới
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
