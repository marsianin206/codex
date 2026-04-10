'use client';

import Link from 'next/link';
import { useSession, signIn, signOut } from 'next-auth/react';
import { cn } from '@/lib/utils';
import { 
  Code2, 
  Search, 
  Plus, 
  User, 
  LogOut, 
  Settings,
  Menu,
  X
} from 'lucide-react';
import { useState } from 'react';

export function Header() {
  const { data: session } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#2A2A2A] bg-[#0A0A0A]/95 backdrop-blur supports-[backdrop-filter]:bg-[#0A0A0A]/80">
      <div className="container mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 font-semibold text-[#EDEDED]">
            <Code2 className="h-6 w-6 text-[#0070F3]" />
            <span className="text-lg">Codex</span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/explore" className="text-sm text-[#888888] hover:text-[#EDEDED] transition-colors">
              Explore
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 rounded-lg border border-[#2A2A2A] bg-[#111111] px-3 py-1.5">
            <Search className="h-4 w-4 text-[#666666]" />
            <input 
              type="text" 
              placeholder="Search snippets..." 
              className="w-48 bg-transparent text-sm text-[#EDEDED] placeholder:text-[#666666] focus:outline-none"
            />
          </div>

          {session ? (
            <div className="hidden md:flex items-center gap-3">
              <Link 
                href="/new"
                className="flex items-center gap-2 rounded-lg bg-[#0070F3] px-4 py-1.5 text-sm font-medium text-white hover:bg-[#0051A8] transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>New</span>
              </Link>
              
              <Link href={`/${session.user?.name || session.user?.email}`} className="flex items-center gap-2">
                {session.user?.image ? (
                  <img 
                    src={session.user.image} 
                    alt={session.user.name || ''}
                    className="h-7 w-7 rounded-full"
                  />
                ) : (
                  <div className="h-7 w-7 rounded-full bg-[#2A2A2A] flex items-center justify-center">
                    <User className="h-4 w-4 text-[#888888]" />
                  </div>
                )}
              </Link>

              <button 
                onClick={() => signOut()}
                className="rounded-lg p-2 text-[#888888] hover:bg-[#1A1A1A] hover:text-[#EDEDED] transition-colors"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-3">
              <button 
                onClick={() => signIn('github')}
                className="rounded-lg border border-[#2A2A2A] bg-[#1A1A1A] px-4 py-1.5 text-sm font-medium text-[#EDEDED] hover:bg-[#2A2A2A] transition-colors"
              >
                Sign in
              </button>
            </div>
          )}

          <button 
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6 text-[#EDEDED]" />
            ) : (
              <Menu className="h-6 w-6 text-[#EDEDED]" />
            )}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#2A2A2A] p-4">
          <div className="flex flex-col gap-4">
            <Link 
              href="/explore" 
              className="text-sm text-[#888888] hover:text-[#EDEDED]"
              onClick={() => setMobileMenuOpen(false)}
            >
              Explore
            </Link>
            
            {session ? (
              <>
                <Link 
                  href="/new" 
                  className="flex items-center gap-2 text-sm text-[#888888] hover:text-[#EDEDED]"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Plus className="h-4 w-4" />
                  New Snippet
                </Link>
                
                <Link 
                  href={`/${session.user?.name || session.user?.email}`} 
                  className="flex items-center gap-2 text-sm text-[#888888] hover:text-[#EDEDED]"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <User className="h-4 w-4" />
                  Profile
                </Link>
                
                <button 
                  onClick={() => signOut()}
                  className="flex items-center gap-2 text-sm text-[#888888] hover:text-[#EDEDED]"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </>
            ) : (
              <button 
                onClick={() => signIn('github')}
                className="rounded-lg bg-[#0070F3] px-4 py-2 text-sm font-medium text-white"
              >
                Sign in
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}