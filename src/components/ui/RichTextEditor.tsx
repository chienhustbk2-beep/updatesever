'use client';import { useState, useRef, useCallback, useEffect } from 'react';import { Bold, Italic, Underline, Link, Video, List, ListOrdered, Heading, Type, Palette, X } from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: string;
}

const FONT_SIZES = ['12px', '14px', '16px', '18px', '20px', '24px', '28px', '32px', '36px', '48px'];
const COLORS = ['#000000','#ffffff','#dc2626','#ea580c','#d97706','#65a30d','#16a34a','#0891b2','#2563eb','#7c3aed','#db2777','#71717a'];

export default function RichTextEditor({ value, onChange, placeholder, minHeight = '200px' }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [showVideoInput, setShowVideoInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');



  const exec = useCallback((command: string, value?: string) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
    editorRef.current?.focus();
  }, [onChange]);

  const handleFontSize = (size: string) => {
    exec('fontSize', '7');
    const sel = window.getSelection();
    if (sel?.rangeCount) {
      const span = sel.getRangeAt(0).startContainer.parentElement;
      if (span && span.nodeName === 'FONT') {
        span.removeAttribute('size');
        span.style.fontSize = size;
      }
    }
    if (editorRef.current) onChange(editorRef.current.innerHTML);
  };

  const handleColor = (color: string) => {
    exec('foreColor', color);
    setShowColorPicker(false);
  };

  const handleLink = () => {
    if (linkUrl) {
      exec('createLink', linkUrl);
      setLinkUrl('');
      setShowLinkInput(false);
    }
  };

  const handleVideo = () => {
    if (videoUrl) {
      let embedUrl = videoUrl;
      const ytMatch = videoUrl.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
      if (ytMatch) {
        embedUrl = `<iframe width="560" height="315" src="https://www.youtube.com/embed/${ytMatch[1]}" frameborder="0" allowfullscreen></iframe>`;
      } else if (videoUrl.includes('facebook.com')) {
        embedUrl = `<iframe src="https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(videoUrl)}" width="560" height="315" frameborder="0" allowfullscreen></iframe>`;
      } else {
        embedUrl = `<video controls width="560"><source src="${videoUrl}"></video>`;
      }
      exec('insertHTML', embedUrl);
      setVideoUrl('');
      setShowVideoInput(false);
    }
  };

  const handleInput = () => {
    if (editorRef.current) onChange(editorRef.current.innerHTML);
  };

  const toolbarBtn = (onClick: () => void, icon: React.ReactNode, active?: boolean) => (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg p-2 text-sm transition ${active ? 'bg-[var(--primary)]/20 text-[var(--primary)]' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'}`}
    >
      {icon}
    </button>
  );

  return (
    <div className="rounded-xl border border-divider overflow-hidden bg-white">
      <div className="flex flex-wrap items-center gap-0.5 border-b border-divider bg-gray-50 px-3 py-2">
        {toolbarBtn(() => exec('bold'), <Bold className="h-4 w-4" />)}
        {toolbarBtn(() => exec('italic'), <Italic className="h-4 w-4" />)}
        {toolbarBtn(() => exec('underline'), <Underline className="h-4 w-4" />)}
        <div className="mx-1 h-6 w-px bg-gray-200" />
        {toolbarBtn(() => exec('formatBlock', '<h2>'), <Heading className="h-4 w-4" />)}
        <select
          onChange={e => handleFontSize(e.target.value)}
          className="rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs text-gray-600 outline-none"
        >
          <option value="">Cỡ chữ</option>
          {FONT_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <div className="relative">
          {toolbarBtn(() => setShowColorPicker(!showColorPicker), <Palette className="h-4 w-4" />, showColorPicker)}
          {showColorPicker && (
            <div className="absolute left-0 top-full z-50 mt-1 rounded-xl border border-gray-200 bg-white p-3 shadow-xl">
              <div className="grid grid-cols-6 gap-1.5">
                {COLORS.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => handleColor(c)}
                    className="h-7 w-7 rounded-lg border border-gray-100 hover:scale-110 transition"
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="mx-1 h-6 w-px bg-gray-200" />
        {toolbarBtn(() => exec('insertUnorderedList'), <List className="h-4 w-4" />)}
        {toolbarBtn(() => exec('insertOrderedList'), <ListOrdered className="h-4 w-4" />)}
        <div className="mx-1 h-6 w-px bg-gray-200" />
        {toolbarBtn(() => setShowLinkInput(!showLinkInput), <Link className="h-4 w-4" />, showLinkInput)}
        {toolbarBtn(() => setShowVideoInput(!showVideoInput), <Video className="h-4 w-4" />, showVideoInput)}
      </div>
      {showLinkInput && (
        <div className="flex items-center gap-2 border-b border-divider bg-gray-50 px-3 py-2">
          <input
            value={linkUrl}
            onChange={e => setLinkUrl(e.target.value)}
            placeholder="Nhập URL link..."
            className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm outline-none focus:border-[var(--primary)]"
          />
          <button type="button" onClick={handleLink} className="rounded-lg bg-[var(--primary)] px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90">Gắn link</button>
          <button type="button" onClick={() => { exec('unlink'); setShowLinkInput(false) }} className="rounded-lg bg-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-300">Bỏ link</button>
        </div>
      )}
      {showVideoInput && (
        <div className="flex items-center gap-2 border-b border-divider bg-gray-50 px-3 py-2">
          <input
            value={videoUrl}
            onChange={e => setVideoUrl(e.target.value)}
            placeholder="Nhập URL video (YouTube, Facebook...)"
            className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm outline-none focus:border-[var(--primary)]"
          />
          <button type="button" onClick={handleVideo} className="rounded-lg bg-[var(--primary)] px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90">Nhúng</button>
        </div>
      )}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        className="prose prose-sm max-w-none px-4 py-3 text-gray-800 outline-none overflow-y-auto"
        style={{ minHeight, maxHeight: '500px' }}
        data-placeholder={placeholder}
        dangerouslySetInnerHTML={{ __html: value }}
      />
    </div>
  );
}
