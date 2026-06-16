'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Shield, Lock, Eye, EyeOff, Delete } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const PIN_KEY = 'organizer_pin_hash';
const LOCKOUT_KEY = 'organizer_lockout_until';

// Simple hash function for PIN (not cryptographic, but sufficient for local device privacy)
async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin + 'organizer_salt_2024');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

function getStoredPinHash(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(PIN_KEY);
}

function isLockedOut(): boolean {
  const lockoutUntil = localStorage.getItem(LOCKOUT_KEY);
  if (!lockoutUntil) return false;
  if (Date.now() > parseInt(lockoutUntil)) {
    localStorage.removeItem(LOCKOUT_KEY);
    return false;
  }
  return true;
}

function setLockout(minutes: number) {
  localStorage.setItem(LOCKOUT_KEY, (Date.now() + minutes * 60 * 1000).toString());
}

function getInitialPhase(): 'setup' | 'enter' {
  if (typeof window === 'undefined') return 'setup';
  const stored = getStoredPinHash();
  if (stored || isLockedOut()) return 'enter';
  return 'setup';
}

function getInitialLockState(): { locked: boolean; lockoutTime: number } {
  if (typeof window === 'undefined') return { locked: false, lockoutTime: 0 };
  if (isLockedOut()) {
    const remaining = parseInt(localStorage.getItem(LOCKOUT_KEY) || '0') - Date.now();
    return { locked: true, lockoutTime: Math.ceil(remaining / 60000) };
  }
  return { locked: false, lockoutTime: 0 };
}

export function PinLock({ onUnlocked }: { onUnlocked: () => void }) {
  const [phase, setPhase] = useState<'checking' | 'setup' | 'enter'>(() => getInitialPhase());
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState('');
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [locked, setLocked] = useState(() => getInitialLockState().locked);
  const [lockoutTime, setLockoutTime] = useState(() => getInitialLockState().lockoutTime);
  const inputRef = useRef<HTMLInputElement>(null);

  // Cleanup expired lockout on mount
  useEffect(() => {
    if (locked && lockoutTime > 0) {
      const remaining = parseInt(localStorage.getItem(LOCKOUT_KEY) || '0') - Date.now();
      if (remaining <= 0) {
        localStorage.removeItem(LOCKOUT_KEY);
        // Schedule state updates asynchronously to avoid synchronous setState in effect
        setTimeout(() => {
          setLocked(false);
          setLockoutTime(0);
        }, 0);
      }
    }
  }, [locked, lockoutTime]);

  // Countdown timer for lockout
  useEffect(() => {
    if (!locked) return;
    const interval = setInterval(() => {
      const remaining = parseInt(localStorage.getItem(LOCKOUT_KEY) || '0') - Date.now();
      if (remaining <= 0) {
        setLocked(false);
        setLockoutTime(0);
        localStorage.removeItem(LOCKOUT_KEY);
        setFailedAttempts(0);
        clearInterval(interval);
      } else {
        setLockoutTime(Math.ceil(remaining / 60000));
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [locked]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [phase]);

  const handleSetup = useCallback(async () => {
    setError('');
    if (pin.length < 4) {
      setError('PIN must be at least 4 digits');
      return;
    }
    if (pin !== confirmPin) {
      setError('PINs do not match');
      return;
    }
    const hash = await hashPin(pin);
    localStorage.setItem(PIN_KEY, hash);
    onUnlocked();
  }, [pin, confirmPin, onUnlocked]);

  const handleUnlock = useCallback(async () => {
    if (locked) return;
    setError('');
    const stored = getStoredPinHash();
    if (!stored) {
      setPhase('setup');
      return;
    }
    const hash = await hashPin(pin);
    if (hash === stored) {
      setFailedAttempts(0);
      onUnlocked();
    } else {
      const attempts = failedAttempts + 1;
      setFailedAttempts(attempts);
      setPin('');

      if (attempts >= 5) {
        setLocked(true);
        setLockout(5);
        setError('Too many failed attempts. Locked for 5 minutes.');
      } else if (attempts >= 3) {
        setError(`Wrong PIN. ${5 - attempts} attempts before lockout.`);
      } else {
        setError('Wrong PIN. Try again.');
      }
    }
  }, [pin, failedAttempts, locked, onUnlocked]);

  const handleClearPin = () => {
    if (confirm('Are you sure you want to remove the PIN lock? Anyone will be able to access your data.')) {
      localStorage.removeItem(PIN_KEY);
      localStorage.removeItem(LOCKOUT_KEY);
      setPin('');
      setConfirmPin('');
      setPhase('setup');
      setError('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (phase === 'setup') handleSetup();
      else handleUnlock();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm flex flex-col items-center gap-6">
        {/* Icon */}
        <div className="size-16 rounded-2xl bg-emerald-600 flex items-center justify-center shadow-lg">
          <Shield className="size-8 text-white" />
        </div>

        <div className="text-center space-y-1">
          <h1 className="text-xl font-bold">Personal Organizer</h1>
          <p className="text-sm text-muted-foreground">
            {phase === 'setup'
              ? 'Create a PIN to protect your data'
              : 'Enter your PIN to continue'}
          </p>
        </div>

        {/* PIN Input */}
        <div className="w-full space-y-3">
          <div className="relative">
            <Input
              ref={inputRef}
              type={showPin ? 'text' : 'password'}
              inputMode="numeric"
              placeholder="Enter PIN"
              value={pin}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '').slice(0, 8);
                setPin(val);
                setError('');
              }}
              onKeyDown={handleKeyDown}
              className="h-12 text-center text-lg tracking-[0.3em] font-mono"
              disabled={locked}
              autoComplete="off"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 size-8"
              onClick={() => setShowPin(!showPin)}
            >
              {showPin ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </Button>
          </div>

          {phase === 'setup' && (
            <div className="relative">
              <Input
                type={showPin ? 'text' : 'password'}
                inputMode="numeric"
                placeholder="Confirm PIN"
                value={confirmPin}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 8);
                  setConfirmPin(val);
                  setError('');
                }}
                onKeyDown={handleKeyDown}
                className="h-12 text-center text-lg tracking-[0.3em] font-mono"
                autoComplete="off"
              />
            </div>
          )}

          {error && (
            <p className={`text-sm text-center ${locked ? 'text-destructive font-medium' : 'text-destructive'}`}>
              {locked && <Lock className="inline size-3.5 mr-1" />}
              {error}
              {locked && lockoutTime > 0 && ` (${lockoutTime} min)`}
            </p>
          )}

          <Button
            className="w-full h-11 gap-2"
            onClick={phase === 'setup' ? handleSetup : handleUnlock}
            disabled={locked || (phase === 'setup' && (pin.length < 4 || !confirmPin))}
          >
            <Lock className="size-4" />
            {phase === 'setup' ? 'Set PIN & Continue' : 'Unlock'}
          </Button>

          {phase === 'enter' && !locked && (
            <Button variant="ghost" size="sm" className="w-full text-xs text-muted-foreground gap-1" onClick={handleClearPin}>
              <Delete className="size-3" />
              Reset PIN (removes lock)
            </Button>
          )}
        </div>

        <p className="text-[11px] text-muted-foreground/60 text-center max-w-xs">
          All data is stored locally on this device only. No data is sent to any server.
        </p>
      </div>
    </div>
  );
}