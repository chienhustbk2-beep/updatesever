'use client';import { useTheme } from '@/components/ThemeProvider';import { Moon, Sun } from 'lucide-react';import { useState, useEffect } from 'react'
export default function AdminThemeToggle() {  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);useEffect(() => { setMounted(true) }, []);
  if (!mounted) return <div className="h-8 w-8" />;
  return (    <button      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}      className="rounded-lg p-2 text-muted transition hover:bg-hover hover:text-primary"      title={theme === 'dark' ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}    >      {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}    </button>  )}