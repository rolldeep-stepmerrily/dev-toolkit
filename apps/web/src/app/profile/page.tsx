'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/auth-context';
import { useUserData } from '@/contexts/user-data-context';
import { ApiError, apiFetch } from '@/lib/api';

export default function ProfilePage(): React.JSX.Element {
  const router = useRouter();
  const { user, getValidToken } = useAuth();
  const { profile, refreshProfile } = useUserData();

  const [name, setName] = useState('');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
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
    }
  }, [profile]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];

    if (!file) return;

    setAvatarFile(file);
    setAvatarPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
  };

  useEffect(() => {
    return () => {
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    };
  }, [avatarPreview]);

  const handleProfileSave = async (): Promise<void> => {
    const token = await getValidToken();

    if (!token) return;

    setProfileSaving(true);
    setProfileMessage(null);

    try {
      let newAvatarUrl: string | undefined;

      if (avatarFile) {
        // 1. presigned URL 발급
        const { presignedUrl, objectUrl } = await apiFetch<{ presignedUrl: string; objectUrl: string }>(
          '/users/me/avatar/presigned',
          {
            method: 'POST',
            token,
            body: JSON.stringify({ filename: avatarFile.name, contentType: avatarFile.type }),
          },
        );

        // 2. MinIO에 직접 업로드
        const uploadRes = await fetch(presignedUrl, {
          method: 'PUT',
          headers: { 'Content-Type': avatarFile.type },
          body: avatarFile,
        });

        if (!uploadRes.ok) throw new Error('이미지 업로드에 실패했습니다');

        newAvatarUrl = objectUrl;
        setAvatarFile(null);
      }

      // 3. 프로필 업데이트
      await apiFetch('/users/me', {
        method: 'PATCH',
        token,
        body: JSON.stringify({
          name: name.trim() || null,
          ...(newAvatarUrl && { avatarUrl: newAvatarUrl }),
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
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: '새 비밀번호가 일치하지 않습니다' });
      return;
    }

    if (newPassword.length < 8) {
      setPasswordMessage({ type: 'error', text: '비밀번호는 최소 8자 이상이어야 합니다' });
      return;
    }

    const token = await getValidToken();

    if (!token) return;

    setPasswordSaving(true);
    setPasswordMessage(null);

    try {
      await apiFetch('/users/me/password', {
        method: 'POST',
        token,
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
          <button
            type="button"
            className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full bg-muted hover:opacity-80 transition-opacity"
            onClick={() => fileInputRef.current?.click()}
            aria-label="프로필 사진 변경"
          >
            {(avatarPreview ?? profile.avatarUrl) ? (
              <Image
                src={(avatarPreview ?? profile.avatarUrl) as string}
                alt="avatar"
                fill
                unoptimized
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-muted-foreground">
                {(profile.name ?? profile.email)[0]?.toUpperCase()}
              </div>
            )}
          </button>
          <div className="text-sm text-muted-foreground">
            <p className="font-medium text-foreground">{profile.email}</p>
            <p>클릭하여 프로필 사진 변경 (최대 2MB)</p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarChange}
          />
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
        </div>

        {profileMessage && (
          <p className={profileMessage.type === 'success' ? 'text-sm text-green-600' : 'text-sm text-destructive'}>
            {profileMessage.text}
          </p>
        )}

        <Button
          onClick={handleProfileSave}
          disabled={profileSaving}
          className="w-full"
        >
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

          <Button
            onClick={handlePasswordChange}
            disabled={passwordSaving}
            className="w-full"
          >
            {passwordSaving ? '변경 중...' : '비밀번호 변경'}
          </Button>
        </Card>
      )}
    </div>
  );
}
