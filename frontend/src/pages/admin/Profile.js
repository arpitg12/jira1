import React, { useState } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { Card, Button, Breadcrumb, InputField, Select } from '../../components/common';

const Profile = () => {
  const [userData, setUserData] = useState({
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@jira.com',
    phone: '+1 (555) 123-4567',
    timezone: 'UTC-5 (EST)',
    language: 'English',
  });

  const handleChange = (e) => {
    setUserData({ ...userData, [e.target.name]: e.target.value });
  };

  return (
    <AdminLayout>
      <div>
        <Breadcrumb items={[
          { label: 'Home', href: '/admin' },
          { label: 'Profile', href: '/admin/profile', active: true }
        ]} />
        <h1 className="ui-title mb-4">My Profile</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {/* Profile Info */}
          <div className="lg:col-span-2 space-y-3">
            <Card title="Personal Information">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-primary text-white rounded-2xl flex items-center justify-center text-xl font-bold ui-shadow">
                  {userData.firstName.charAt(0)}{userData.lastName.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-dark">{userData.firstName} {userData.lastName}</p>
                  <p className="text-gray-600">{userData.email}</p>
                  <p className="text-xs text-gray-500 mt-1">Member since Jan 2024</p>
                </div>
              </div>

              <form className="space-y-4">
                <InputField
                  label="First Name"
                  name="firstName"
                  value={userData.firstName}
                  onChange={handleChange}
                />
                <InputField
                  label="Last Name"
                  name="lastName"
                  value={userData.lastName}
                  onChange={handleChange}
                />
                <InputField
                  label="Email"
                  type="email"
                  name="email"
                  value={userData.email}
                  onChange={handleChange}
                />
                <InputField
                  label="Phone"
                  name="phone"
                  value={userData.phone}
                  onChange={handleChange}
                />
                <Button variant="primary" size="sm" type="submit">Save Changes</Button>
              </form>
            </Card>

            <Card title="Preferences">
              <div className="space-y-4">
                <Select
                  label="Timezone"
                  name="timezone"
                  value={userData.timezone}
                  onChange={handleChange}
                  options={[
                    { value: 'UTC-8', label: 'UTC-8 (PST)' },
                    { value: 'UTC-5', label: 'UTC-5 (EST)' },
                    { value: 'UTC+0', label: 'UTC+0 (GMT)' },
                    { value: 'UTC+1', label: 'UTC+1 (CET)' },
                  ]}
                />
                <Select
                  label="Language"
                  name="language"
                  value={userData.language}
                  onChange={handleChange}
                  options={[
                    { value: 'English', label: 'English' },
                    { value: 'Spanish', label: 'Español' },
                    { value: 'French', label: 'Français' },
                    { value: 'German', label: 'Deutsch' },
                  ]}
                />
                <Button variant="primary" size="sm" type="submit">Update Preferences</Button>
              </div>
            </Card>
          </div>

          {/* Security */}
          <div>
            <Card title="Security">
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-semibold text-dark mb-2">Password</p>
                  <Button variant="outline" size="sm" className="w-full">Change Password</Button>
                </div>
                <div>
                  <p className="text-sm font-semibold text-dark mb-2">Two-Factor Auth</p>
                  <Button variant="outline" size="sm" className="w-full">Enable 2FA</Button>
                </div>
                <div>
                  <p className="text-sm font-semibold text-dark mb-2">Active Sessions</p>
                  <p className="text-sm text-gray-600 mb-2">1 session active</p>
                  <Button variant="outline" size="sm" className="w-full">Logout All</Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Profile;
