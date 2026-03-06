'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/auth-context';
import { useUserData } from '@/contexts/user-data-context';
import { ApiError, apiFetch } from '@/lib/api';

export default function ProfilePage(): React.JSX.Element {
  const router = useRouter();
  const { user, accessToken } = useAuth();
  const { profile, refreshProfile } = useUserData();

  const [name, setName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (!user) {
      router.replace('/login');
    }
  }, [user, router]);

  useEffect(() => {
    if (profile) {
      setName(profile.name ?? '');
      setAvatarUrl(profile.avatarUrl ?? '');
    }
  }, [profile]);

  const handleProfileSave = async (): Promise<void> => {
    if (!accessToken) return;

    setProfileSaving(true);
    setProfileMessage(null);

    try {
      await apiFetch('/users/me', {
        method: 'PATCH',
        token: accessToken,
        body: JSON.stringify({
          name: name.trim() || null,
          avatarUrl: avatarUrl.trim() || null,
        }),
      });

      await refreshProfile();
      setProfileMessage({ type: 'success', text: '프로필이 저장되었습니다' });
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : '저장에 실패했습니다';
      setProfileMessage({ type: 'error', text: msg });
    } finally {
      setProfileSaving(false);
    }
  };

  const handlePasswordChange = async (): Promise<void> => {
    if (!accessToken) return;

    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: '새 비밀번호가 일치하지 않습니다' });
      return;
    }

    if (newPassword.length < 8) {
      setPasswordMessage({ type: 'error', text: '비밀번호는 최소 8자 이상이어야 합니다' });
      return;
    }

    setPasswordSaving(true);
    setPasswordMessage(null);

    try {
      await apiFetch('/users/me/password', {
        method: 'POST',
        token: accessToken,
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordMessage({ type: 'success', text: '비밀번호가 변경되었습니다' });
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : '변경에 실패했습니다';
      setPasswordMessage({ type: 'error', text: msg });
    } finally {
      setPasswordSaving(false);
    }
  };

  if (!(user && profile)) {
    return <div className="flex items-center justify-center h-40 text-muted-foreground">로딩 중...</div>;
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <h1 className="text-2xl font-bold">프로필 설정</h1>

      {/* 프로필 수정 */}
      <Card className="p-6 space-y-5">
        <h2 className="text-base font-semibold">기본 정보</h2>

        {/* 아바타 미리보기 */}
        <div className="flex items-center gap-4">
          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full bg-muted">
            {avatarUrl ? (
              <Image src={avatarUrl} alt="avatar" fill unoptimized className="object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-muted-foreground">
                {(profile.name ?? profile.email)[0]?.toUpperCase()}
              </div>
            )}
          </div>
          <div className="text-sm text-muted-foreground">
            <p className="font-medium text-foreground">{profile.email}</p>
            <p>프로필 사진은 URL로 입력하세요</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="name">이름</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="이름 입력"
              maxLength={50}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="avatarUrl">아바타 URL</Label>
            <Input
              id="avatarUrl"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://example.com/avatar.png"
              type="url"
            />
          </div>
        </div>

        {profileMessage && (
          <p className={profileMessage.type === 'success' ? 'text-sm text-green-600' : 'text-sm text-destructive'}>
            {profileMessage.text}
          </p>
        )}

        <Button onClick={handleProfileSave} disabled={profileSaving} className="w-full">
          {profileSaving ? '저장 중...' : '저장'}
        </Button>
      </Card>

      {/* 비밀번호 변경 */}
      {profile.hasPassword && (
        <Card className="p-6 space-y-5">
          <h2 className="text-base font-semibold">비밀번호 변경</h2>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="currentPassword">현재 비밀번호</Label>
              <Input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="현재 비밀번호"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="newPassword">새 비밀번호</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="8자 이상"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword">새 비밀번호 확인</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="비밀번호 확인"
              />
            </div>
          </div>

          {passwordMessage && (
            <p className={passwordMessage.type === 'success' ? 'text-sm text-green-600' : 'text-sm text-destructive'}>
              {passwordMessage.text}
            </p>
          )}

          <Button onClick={handlePasswordChange} disabled={passwordSaving} className="w-full">
            {passwordSaving ? '변경 중...' : '비밀번호 변경'}
          </Button>
        </Card>
      )}
    </div>
  );
}
