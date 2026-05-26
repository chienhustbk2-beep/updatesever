'use client';import { useEditor, EditorContent } from '@tiptap/react';import { StarterKit } from '@tiptap/starter-kit';import { Link } from '@tiptap/extension-link';import { Image } from '@tiptap/extension-image';import { TextAlign } from '@tiptap/extension-text-align';import { Color, FontSize, FontFamily, TextStyle, BackgroundColor } from '@tiptap/extension-text-style';import { Underline } from '@tiptap/extension-underline';import { Placeholder } from '@tiptap/extension-placeholder';import { useEffect, useCallback } from 'react';import { Bold, Italic, Underline as UnderlineIcon, Strikethrough, AlignLeft, AlignCenter, AlignRight, List, ListOrdered, Link as LinkIcon, Image as ImageIcon, Quote, Code, Undo, Redo, Heading1, Heading2, Heading3, Pilcrow, Minus, Eraser, Palette, Highlighter, Type } from 'lucide-react';
const FONT_SIZES = ['12px', '13px', '14px', '15px', '16px', '18px', '20px', '22px', '24px', '28px', '32px', '36px', '42px', '48px'];
const FONT_FAMILIES = ['inherit', 'Arial, sans-serif', 'Helvetica, sans-serif', 'Georgia, serif', '"Times New Roman", serif', 'Courier New, monospace', 'Verdana, sans-serif', 'Tahoma, sans-serif', '"Segoe UI", sans-serif', 'Impact, sans-serif'];
function MenuButton({ onClick, active, children, title }: { onClick: () => void; active?: boolean; children: React.ReactNode; title?: string }) {
  return (
    <button type="button" onClick={onClick} title={title}
      className={`rounded-lg p-2 transition ${active ? 'bg-[var(--primary)]/15 text-[var(--primary)]' : 'text-muted hover:bg-hover hover:text-main'}`}>
      {children}
    </button>
  );
}
export default function RichEditor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Underline,
      Link.configure({ openOnClick: false, HTMLAttributes: { class: 'text-[var(--primary)] underline' } }),
      Image.configure({ inline: true }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      TextStyle,
      FontSize,
      FontFamily,
      Color,
      BackgroundColor,
      Placeholder.configure({ placeholder: 'Soạn thảo nội dung...' }),
    ],
    content: value || '',
    onUpdate: ({ editor }) => { const html = editor.getHTML(); if (html !== value) onChange(html) },
  });
  useEffect(() => { if (editor && value && editor.getHTML() !== value) { editor.commands.setContent(value, { emitUpdate: false }) } }, [value, editor]);
  const addLink = useCallback(() => { if (!editor) return; const url = window.prompt('Nhập URL:'); if (url) editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run() }, [editor]);
  const addImage = useCallback(() => { if (!editor) return; const url = window.prompt('Nhập URL hình ảnh:'); if (url) editor.chain().focus().setImage({ src: url }).run() }, [editor]);
  if (!editor) return <div className="min-h-[260px] rounded-xl border border-divider bg-main animate-pulse" />;
  return (
    <div className="rich-editor border border-divider rounded-xl overflow-hidden bg-main">
      <div className="flex flex-wrap items-center gap-0.5 border-b border-divider bg-card px-2 py-1.5">
        <MenuButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="In đậm (Ctrl+B)"><Bold className="h-4 w-4" /></MenuButton>
        <MenuButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="In nghiêng (Ctrl+I)"><Italic className="h-4 w-4" /></MenuButton>
        <MenuButton onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Gạch chân (Ctrl+U)"><UnderlineIcon className="h-4 w-4" /></MenuButton>
        <MenuButton onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="Gạch ngang"><Strikethrough className="h-4 w-4" /></MenuButton>
        <div className="mx-1 h-6 w-px bg-divider" />
        <MenuButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive('heading', { level: 1 })} title="Tiêu đề 1"><Heading1 className="h-4 w-4" /></MenuButton>
        <MenuButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="Tiêu đề 2"><Heading2 className="h-4 w-4" /></MenuButton>
        <MenuButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} title="Tiêu đề 3"><Heading3 className="h-4 w-4" /></MenuButton>
        <MenuButton onClick={() => editor.chain().focus().setParagraph().run()} active={editor.isActive('paragraph')} title="Đoạn văn"><Pilcrow className="h-4 w-4" /></MenuButton>
        <div className="mx-1 h-6 w-px bg-divider" />
        <MenuButton onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} title="Căn trái"><AlignLeft className="h-4 w-4" /></MenuButton>
        <MenuButton onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} title="Căn giữa"><AlignCenter className="h-4 w-4" /></MenuButton>
        <MenuButton onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })} title="Căn phải"><AlignRight className="h-4 w-4" /></MenuButton>
        <div className="mx-1 h-6 w-px bg-divider" />
        <MenuButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Danh sách"><List className="h-4 w-4" /></MenuButton>
        <MenuButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Danh sách số"><ListOrdered className="h-4 w-4" /></MenuButton>
        <MenuButton onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="Trích dẫn"><Quote className="h-4 w-4" /></MenuButton>
        <MenuButton onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive('codeBlock')} title="Code"><Code className="h-4 w-4" /></MenuButton>
        <div className="mx-1 h-6 w-px bg-divider" />
        <select onChange={(e) => editor.chain().focus().setFontFamily(e.target.value).run()} value="" className="rounded-lg bg-main border border-divider px-2 py-1.5 text-xs text-muted focus:outline-none">
          <option value="" disabled>Font chữ</option>
          {FONT_FAMILIES.map(f => <option key={f} value={f}>{f === 'inherit' ? 'Mặc định' : f.split(',')[0].replace(/['"]/g, '')}</option>)}
        </select>
        <select onChange={(e) => editor.chain().focus().setFontSize(e.target.value).run()} value="" className="rounded-lg bg-main border border-divider px-2 py-1.5 text-xs text-muted focus:outline-none">
          <option value="" disabled>Cỡ chữ</option>
          {FONT_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <div className="mx-1 h-6 w-px bg-divider" />
        <div className="relative flex items-center">
          <Palette className="h-3.5 w-3.5 text-muted absolute left-2 pointer-events-none" />
          <input type="color" onChange={(e) => editor.chain().focus().setColor(e.target.value).run()} title="Màu chữ" className="h-8 w-9 rounded cursor-pointer border-0 p-0.5 pl-5" />
        </div>
        <div className="relative flex items-center">
          <Highlighter className="h-3.5 w-3.5 text-muted absolute left-2 pointer-events-none" />
          <input type="color" onChange={(e) => editor.chain().focus().setBackgroundColor(e.target.value).run()} title="Màu nền chữ" className="h-8 w-9 rounded cursor-pointer border-0 p-0.5 pl-5" />
        </div>
        <div className="mx-1 h-6 w-px bg-divider" />
        <MenuButton onClick={addLink} active={editor.isActive('link')} title="Chèn link"><LinkIcon className="h-4 w-4" /></MenuButton>
        <MenuButton onClick={addImage} title="Chèn ảnh"><ImageIcon className="h-4 w-4" /></MenuButton>
        <div className="mx-1 h-6 w-px bg-divider" />
        <MenuButton onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Đường kẻ ngang"><Minus className="h-4 w-4" /></MenuButton>
        <MenuButton onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()} title="Xóa định dạng"><Eraser className="h-4 w-4" /></MenuButton>
        <div className="mx-1 h-6 w-px bg-divider" />
        <MenuButton onClick={() => editor.chain().focus().undo().run()} title="Hoàn tác (Ctrl+Z)"><Undo className="h-4 w-4" /></MenuButton>
        <MenuButton onClick={() => editor.chain().focus().redo().run()} title="Làm lại (Ctrl+Y)"><Redo className="h-4 w-4" /></MenuButton>
      </div>
      <EditorContent editor={editor} className="prose prose-sm max-w-none px-4 py-3" />
      <style>{`
        .rich-editor .ProseMirror { outline: none; min-height: 160px; }
        .rich-editor .ProseMirror p { margin: 0.25em 0; }
        .rich-editor .ProseMirror h1 { font-size: 1.5em; font-weight: 700; }
        .rich-editor .ProseMirror h2 { font-size: 1.25em; font-weight: 600; }
        .rich-editor .ProseMirror h3 { font-size: 1.1em; font-weight: 600; }
        .rich-editor .ProseMirror ul, .rich-editor .ProseMirror ol { padding-left: 1.5em; }
        .rich-editor .ProseMirror blockquote { border-left: 3px solid var(--primary); padding-left: 1em; color: var(--text-muted); font-style: italic; }
        .rich-editor .ProseMirror pre { background: var(--bg-card); border: 1px solid var(--divider); border-radius: 8px; padding: 0.75em; font-size: 13px; }
        .rich-editor .ProseMirror img { max-width: 100%; height: auto; border-radius: 8px; }
        .rich-editor .ProseMirror a { color: var(--primary); text-decoration: underline; }
        .rich-editor .ProseMirror hr { border: none; border-top: 1px solid var(--divider); margin: 1em 0; }
        .rich-editor .ProseMirror p.is-editor-empty:first-child::before { content: attr(data-placeholder); float: left; color: var(--text-muted); pointer-events: none; height: 0; }
      `}</style>
    </div>
  );
}