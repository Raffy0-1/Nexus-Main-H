import React, { useState, useRef } from 'react';
import { User, Lock, Bell, Globe, Palette, CreditCard, Camera, Loader2 } from 'lucide-react';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { useAuth } from '../../context/useAuth';
import api from '../../utils/api';
import toast from 'react-hot-toast';

export const SettingsPage: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    location: 'San Francisco, CA',
    bio: user?.bio || ''
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  if (!user) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSaveProfile = async () => {
    if (!user.id) return;
    try {
      setIsSaving(true);
      await updateProfile(user.id, {
        bio: formData.bio,
        location: formData.location
      } as any);
    } catch (error) {
      // Error handled in context
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploadingAvatar(true);
      const formData = new FormData();
      formData.append('avatar', file);
      const res = await api.put('/profiles/me/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      // Update the local user object so avatar previews immediately
      await updateProfile(user.id, { avatarUrl: res.data.user?.avatarUrl } as any);
      toast.success('Avatar updated successfully!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to upload avatar');
    } finally {
      setIsUploadingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  };

  const handleChangePassword = async () => {
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      toast.error('Please fill in all password fields');
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (passwordData.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }
    try {
      setIsSavingPassword(true);
      await api.put('/auth/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      toast.success('Password updated successfully!');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update password');
    } finally {
      setIsSavingPassword(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in relative shadow-sm">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">Manage your account preferences and settings</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Settings navigation */}
        <Card className="lg:col-span-1 border border-gray-200">
          <CardBody className="p-2">
            <nav className="space-y-1">
              <button className="flex items-center w-full px-3 py-2 text-sm font-medium text-primary-700 bg-primary-50 rounded-md">
                <User size={18} className="mr-3" />
                Profile
              </button>

              <button className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-md transition-colors">
                <Lock size={18} className="mr-3" />
                Security
              </button>

              <button className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-md transition-colors">
                <Bell size={18} className="mr-3" />
                Notifications
              </button>

              <button className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-md transition-colors">
                <Globe size={18} className="mr-3" />
                Language
              </button>

              <button className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-md transition-colors">
                <Palette size={18} className="mr-3" />
                Appearance
              </button>

              <button className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-md transition-colors">
                <CreditCard size={18} className="mr-3" />
                Billing
              </button>
            </nav>
          </CardBody>
        </Card>

        {/* Main settings content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Profile Settings */}
          <Card className="border border-gray-200 shadow-sm">
            <CardHeader>
              <h2 className="text-lg font-medium text-gray-900">Profile Settings</h2>
            </CardHeader>
            <CardBody className="space-y-6">
              <div className="flex items-center gap-6">
                <div className="relative">
                  <Avatar
                    src={user.avatarUrl}
                    alt={user.name}
                    size="xl"
                  />
                  {isUploadingAvatar && (
                    <div className="absolute inset-0 bg-white/70 rounded-full flex items-center justify-center">
                      <Loader2 className="animate-spin text-primary-600" size={20} />
                    </div>
                  )}
                </div>

                <div>
                  <input
                    type="file"
                    ref={avatarInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleAvatarChange}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<Camera size={16} />}
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={isUploadingAvatar}
                  >
                    {isUploadingAvatar ? 'Uploading...' : 'Change Photo'}
                  </Button>
                  <p className="mt-2 text-sm text-gray-500">
                    JPG, GIF or PNG. Max size of 800K
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Full Name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange as any}
                />

                <Input
                  label="Email"
                  type="email"
                  name="email"
                  value={formData.email}
                  disabled
                />

                <Input
                  label="Role"
                  value={user.role}
                  disabled
                />

                <Input
                  label="Location"
                  name="location"
                  value={formData.location}
                  onChange={handleChange as any}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bio
                </label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-gray-300 p-3 shadow-sm focus:border-primary-500 focus:ring-primary-500 transition outline-none"
                  rows={4}
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline">Cancel</Button>
                <Button onClick={handleSaveProfile} disabled={isSaving}>
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </CardBody>
          </Card>

          {/* Security Settings */}
          <Card className="border border-gray-200 shadow-sm">
            <CardHeader>
              <h2 className="text-lg font-medium text-gray-900">Security Settings</h2>
            </CardHeader>
            <CardBody className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-4">Two-Factor Authentication</h3>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">
                      Add an extra layer of security to your account
                    </p>
                    <Badge variant="error" className="mt-1">Not Enabled</Badge>
                  </div>
                  <Button variant="outline">Enable</Button>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-900 mb-4">Change Password</h3>
                <div className="space-y-4">
                  <Input
                    label="Current Password"
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={e => setPasswordData(p => ({ ...p, currentPassword: e.target.value }))}
                  />

                  <Input
                    label="New Password"
                    type="password"
                    value={passwordData.newPassword}
                    onChange={e => setPasswordData(p => ({ ...p, newPassword: e.target.value }))}
                  />

                  <Input
                    label="Confirm New Password"
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={e => setPasswordData(p => ({ ...p, confirmPassword: e.target.value }))}
                  />

                  <div className="flex justify-end pt-2">
                    <Button
                      onClick={handleChangePassword}
                      disabled={isSavingPassword}
                      leftIcon={isSavingPassword ? <Loader2 size={16} className="animate-spin" /> : undefined}
                    >
                      {isSavingPassword ? 'Updating...' : 'Update Password'}
                    </Button>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
};