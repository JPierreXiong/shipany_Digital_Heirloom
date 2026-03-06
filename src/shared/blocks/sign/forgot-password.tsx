'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { Link } from '@/core/i18n/navigation';
import { Button } from '@/shared/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';

export function ForgotPassword() {
  const t = useTranslations('common.sign');
  
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendCode = async () => {
    if (!email) {
      toast.error('Please enter your email');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Verification code sent to your email');
        setStep('code');
        
        // 开发环境显示验证码
        if (data.code) {
          toast.info(`Dev mode - Code: ${data.code}`, { duration: 10000 });
        }
      } else {
        toast.error(data.error || 'Failed to send code');
      }
    } catch (error) {
      toast.error('Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!code || !newPassword || !confirmPassword) {
      toast.error('Please fill in all fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, newPassword }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Password reset successfully! Redirecting to sign in...');
        setTimeout(() => {
          window.location.href = '/sign-in';
        }, 2000);
      } else {
        toast.error(data.error || 'Failed to reset password');
      }
    } catch (error) {
      toast.error('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="mx-auto w-full md:max-w-md">
      <CardHeader>
        <CardTitle className="text-lg md:text-xl">
          <h1>Reset Password</h1>
        </CardTitle>
        <CardDescription className="text-xs md:text-sm">
          <h2>
            {step === 'email'
              ? 'Enter your email to receive a verification code'
              : 'Enter the code and your new password'}
          </h2>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          {step === 'email' ? (
            <>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendCode()}
                />
              </div>

              <Button
                type="button"
                className="w-full"
                disabled={loading}
                onClick={handleSendCode}
              >
                {loading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  'Send Verification Code'
                )}
              </Button>
            </>
          ) : (
            <>
              <div className="grid gap-2">
                <Label htmlFor="code">Verification Code</Label>
                <Input
                  id="code"
                  type="text"
                  placeholder="6-digit code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  maxLength={6}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="At least 8 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleResetPassword()}
                />
              </div>

              <Button
                type="button"
                className="w-full"
                disabled={loading}
                onClick={handleResetPassword}
              >
                {loading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  'Reset Password'
                )}
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => setStep('email')}
              >
                Back to Email
              </Button>
            </>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <div className="flex w-full justify-center border-t py-4">
          <p className="text-center text-xs text-neutral-500">
            Remember your password?{' '}
            <Link href="/sign-in" className="underline">
              <span className="cursor-pointer dark:text-white/70">
                Sign In
              </span>
            </Link>
          </p>
        </div>
      </CardFooter>
    </Card>
  );
}



