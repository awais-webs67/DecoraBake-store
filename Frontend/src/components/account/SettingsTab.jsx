import { useState, useEffect } from 'react';
import { useUser } from '../../context/UserContext';
import API_BASE_URL from '../../config/api';

export default function SettingsTab({ isMobile }) {
    const { user, updateProfile, token } = useUser();

    // Profile State
    const [profileData, setProfileData] = useState({ firstName: '', lastName: '', phone: '' });
    const [profileLoading, setProfileLoading] = useState(false);
    const [profileError, setProfileError] = useState('');
    const [profileSuccess, setProfileSuccess] = useState('');

    // Password State
    const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [passwordError, setPasswordError] = useState('');
    const [passwordSuccess, setPasswordSuccess] = useState('');

    useEffect(() => {
        if (user) {
            setProfileData({
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                phone: user.phone || ''
            });
        }
    }, [user]);

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setProfileError(''); setProfileSuccess('');
        setProfileLoading(true);
        const result = await updateProfile(profileData);
        if (result.success) {
            setProfileSuccess('Profile updated successfully!');
            setTimeout(() => setProfileSuccess(''), 4000);
        } else {
            setProfileError(result.error || 'Failed to update profile');
        }
        setProfileLoading(false);
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        setPasswordError(''); setPasswordSuccess('');

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setPasswordError('New passwords do not match');
            return;
        }
        if (passwordData.newPassword.length < 6) {
            setPasswordError('Password must be at least 6 characters');
            return;
        }

        setPasswordLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/users/${user._id}/password`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ currentPassword: passwordData.currentPassword, newPassword: passwordData.newPassword })
            });
            const data = await res.json();
            if (res.ok) {
                setPasswordSuccess('Password changed successfully!');
                setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                setTimeout(() => setPasswordSuccess(''), 4000);
            } else {
                setPasswordError(data.error || 'Failed to change password');
            }
        } catch (err) { setPasswordError('Network error'); }
        setPasswordLoading(false);
    };

    const styles = {
        titleContainer: { marginBottom: '24px' },
        sectionTitle: { fontFamily: "'Poppins', sans-serif", fontSize: '22px', fontWeight: '700', color: '#1a1a1a', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 },
        sectionSubtitle: { fontSize: '14px', color: '#64748b', marginTop: '4px', lineHeight: '1.5' },

        card: { border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.02)', marginBottom: '24px' },
        cardHeader: { padding: isMobile ? '20px 20px 16px' : '24px 24px 16px', borderBottom: '1px solid #f1f5f9' },
        cardTitle: { fontSize: '15px', fontWeight: '700', color: '#0f172a', margin: '0 0 4px 0' },
        cardDesc: { fontSize: '13px', color: '#64748b', margin: 0, lineHeight: '1.5' },

        formBody: { padding: isMobile ? '20px' : '24px' },
        grid: { display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '20px', marginBottom: '20px' },

        formGroup: { display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '20px' },
        labelContainer: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
        label: { fontSize: '13px', fontWeight: '600', color: '#0f172a' },
        labelHint: { fontSize: '11px', color: '#94a3b8', fontWeight: '500' },

        input: { width: '100%', padding: '12px 14px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '14px', color: '#0f172a', outline: 'none', transition: 'all 0.2s', background: '#fff', boxSizing: 'border-box' },
        inputFocus: { borderColor: '#6B2346', boxShadow: '0 0 0 2px rgba(107,35,70,0.1)' },
        inputDisabled: { background: '#f8fafc', color: '#94a3b8', cursor: 'not-allowed', borderColor: '#e2e8f0' },

        cardFooter: { background: '#f8fafc', borderTop: '1px solid #f1f5f9', padding: isMobile ? '16px 20px' : '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' },
        footerText: { fontSize: '12px', color: '#64748b' },

        btnSubmit: { padding: '10px 20px', background: '#0f172a', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' },
        btnSubmitLoading: { opacity: 0.7, cursor: 'not-allowed' },

        alert: (type) => ({ background: type === 'error' ? '#FEF2F2' : '#ECFDF5', color: type === 'error' ? '#DC2626' : '#059669', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', border: `1px solid ${type === 'error' ? '#FECDD3' : '#A7F3D0'}`, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' })
    };

    return (
        <div>
            <div style={styles.titleContainer}>
                <h2 style={styles.sectionTitle}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#6B2346" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                    Settings
                </h2>
                <div style={styles.sectionSubtitle}>Manage your profile information and security preferences.</div>
            </div>

            {/* Profile Section */}
            <div style={styles.card}>
                <div style={styles.cardHeader}>
                    <h3 style={styles.cardTitle}>Personal Information</h3>
                    <p style={styles.cardDesc}>This information will be used to auto-fill your details during checkout.</p>
                </div>

                {profileError && <div style={{ ...styles.alert('error'), margin: '20px 32px 0' }}>{profileError}</div>}
                {profileSuccess && <div style={{ ...styles.alert('success'), margin: '20px 32px 0' }}>{profileSuccess}</div>}

                <form onSubmit={handleUpdateProfile}>
                    <div style={styles.formBody}>
                        <div style={styles.grid}>
                            <div style={{ ...styles.formGroup, marginBottom: 0 }}>
                                <label style={styles.label}>First Name</label>
                                <input
                                    type="text"
                                    style={styles.input}
                                    value={profileData.firstName}
                                    onChange={e => setProfileData({ ...profileData, firstName: e.target.value })}
                                    onFocus={(e) => Object.assign(e.target.style, styles.inputFocus)}
                                    onBlur={(e) => { e.target.style.borderColor = '#dcdcdc'; e.target.style.boxShadow = 'none'; }}
                                />
                            </div>
                            <div style={{ ...styles.formGroup, marginBottom: 0 }}>
                                <label style={styles.label}>Last Name</label>
                                <input
                                    type="text"
                                    style={styles.input}
                                    value={profileData.lastName}
                                    onChange={e => setProfileData({ ...profileData, lastName: e.target.value })}
                                    onFocus={(e) => Object.assign(e.target.style, styles.inputFocus)}
                                    onBlur={(e) => { e.target.style.borderColor = '#dcdcdc'; e.target.style.boxShadow = 'none'; }}
                                />
                            </div>
                        </div>

                        <div style={styles.formGroup}>
                            <div style={styles.labelContainer}>
                                <label style={styles.label}>Email Address</label>
                                <span style={styles.labelHint}>Cannot be changed</span>
                            </div>
                            <input type="email" style={{ ...styles.input, ...styles.inputDisabled }} value={user?.email || ''} disabled />
                        </div>

                        <div style={{ ...styles.formGroup, marginBottom: 0 }}>
                            <label style={styles.label}>Phone Number</label>
                            <input
                                type="tel"
                                style={styles.input}
                                value={profileData.phone}
                                onChange={e => setProfileData({ ...profileData, phone: e.target.value })}
                                placeholder="+61 400 000 000"
                                onFocus={(e) => Object.assign(e.target.style, styles.inputFocus)}
                                onBlur={(e) => { e.target.style.borderColor = '#dcdcdc'; e.target.style.boxShadow = 'none'; }}
                            />
                        </div>
                    </div>

                    <div style={styles.cardFooter}>
                        <div style={styles.footerText}>Please use a valid phone number.</div>
                        <button type="submit" style={{ ...styles.btnSubmit, ...(profileLoading ? styles.btnSubmitLoading : {}) }} disabled={profileLoading}>
                            {profileLoading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>

            {/* Password Section */}
            <div style={styles.card}>
                <div style={styles.cardHeader}>
                    <h3 style={styles.cardTitle}>Security Settings</h3>
                    <p style={styles.cardDesc}>Update your password to keep your account secure.</p>
                </div>

                {passwordError && <div style={{ ...styles.alert('error'), margin: '20px 32px 0' }}>{passwordError}</div>}
                {passwordSuccess && <div style={{ ...styles.alert('success'), margin: '20px 32px 0' }}>{passwordSuccess}</div>}

                <form onSubmit={handleChangePassword}>
                    <div style={styles.formBody}>
                        <div style={styles.formGroup}>
                            <label style={styles.label}>Current Password</label>
                            <input
                                type="password"
                                style={styles.input}
                                value={passwordData.currentPassword}
                                onChange={e => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                placeholder="••••••••"
                                required
                                onFocus={(e) => Object.assign(e.target.style, styles.inputFocus)}
                                onBlur={(e) => { e.target.style.borderColor = '#dcdcdc'; e.target.style.boxShadow = 'none'; }}
                            />
                        </div>

                        <div style={styles.grid}>
                            <div style={{ ...styles.formGroup, marginBottom: 0 }}>
                                <label style={styles.label}>New Password</label>
                                <input
                                    type="password"
                                    style={styles.input}
                                    value={passwordData.newPassword}
                                    onChange={e => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                    placeholder="••••••••"
                                    required minLength="6"
                                    onFocus={(e) => Object.assign(e.target.style, styles.inputFocus)}
                                    onBlur={(e) => { e.target.style.borderColor = '#dcdcdc'; e.target.style.boxShadow = 'none'; }}
                                />
                            </div>
                            <div style={{ ...styles.formGroup, marginBottom: 0 }}>
                                <label style={styles.label}>Confirm New Password</label>
                                <input
                                    type="password"
                                    style={styles.input}
                                    value={passwordData.confirmPassword}
                                    onChange={e => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                    placeholder="••••••••"
                                    required
                                    onFocus={(e) => Object.assign(e.target.style, styles.inputFocus)}
                                    onBlur={(e) => { e.target.style.borderColor = '#dcdcdc'; e.target.style.boxShadow = 'none'; }}
                                />
                            </div>
                        </div>
                    </div>

                    <div style={styles.cardFooter}>
                        <div style={styles.footerText}>Password must be at least 6 characters long.</div>
                        <button type="submit" style={{ ...styles.btnSubmit, ...(passwordLoading ? styles.btnSubmitLoading : {}) }} disabled={passwordLoading}>
                            {passwordLoading ? 'Updating Password...' : 'Update Password'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
