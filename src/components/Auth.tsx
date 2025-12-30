import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Mail, Lock, User, Loader2, Eye, EyeOff } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';
import './Auth.css';

export function Auth() {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const { login } = useAuth();
    const { t } = useTranslation();

    React.useEffect(() => {
        document.title = `Sino-Viet Subtitle Studio | ${isLogin ? t('login') : t('signUp')}`;
    }, [isLogin, t]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
        const body = isLogin ? { email, password } : { email, password, name };

        try {
            const response = await fetch(`http://localhost:3001${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            const data = await response.json();

            if (response.ok) {
                login(data.token, data.user, password);
            } else {
                setError(data.error || t('somethingWentWrong'));
            }
        } catch (err) {
            setError(t('connectionFailed'));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="auth-container">
            {/* Geometric Background Decorations */}
            <div className="auth-background-shape shape-1" />
            <div className="auth-background-shape shape-2" />

            {/* Main Template Card */}
            <div className="auth-card animate-auth">
                <div className="auth-header">
                    <h3 className="auth-title">
                        {isLogin ? t('login') : t('signUp')}
                    </h3>
                </div>

                <form onSubmit={handleSubmit} className="auth-form">
                    {error && (
                        <div className="error-message">
                            {error}
                        </div>
                    )}

                    {!isLogin && (
                        <div className="form-group">
                            <label className="form-label">{t('fullName')}</label>
                            <div className="input-wrapper">
                                <User className="input-icon" />
                                <input
                                    type="text"
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="auth-input"
                                    placeholder={t('typeYourName')}
                                />
                            </div>
                        </div>
                    )}

                    <div className="form-group">
                        <label className="form-label">{t('usernameLabel')}</label>
                        <div className="input-wrapper">
                            <Mail className="input-icon" />
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="auth-input"
                                placeholder={t('typeYourEmail')}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">{t('password')}</label>
                        <div className="input-wrapper">
                            <Lock className="input-icon" />
                            <input
                                type={showPassword ? "text" : "password"}
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="auth-input"
                                placeholder={t('typeYourPassword')}
                                style={{ paddingRight: '40px' }}
                            />
                            <button
                                type="button"
                                className="password-toggle"
                                onClick={() => setShowPassword(!showPassword)}
                                tabIndex={-1}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                        {isLogin && (
                            <button type="button" className="forgot-password">{t('forgotPassword')}</button>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="auth-button"
                    >
                        {isSubmitting ? (
                            <Loader2 style={{ width: '20px', height: '20px', animation: 'spin 1s linear infinite' }} />
                        ) : (
                            <span>{isLogin ? t('login') : t('signUp')}</span>
                        )}
                    </button>
                </form>

                <div className="social-auth">


                    <div className="toggle-auth">
                        <p className="toggle-label">
                            {isLogin ? t('dontHaveAccount') : t('haveAccount')}
                        </p>
                        <button
                            onClick={() => setIsLogin(!isLogin)}
                            className="toggle-btn"
                        >
                            {isLogin ? t('signUp') : t('login')}
                        </button>
                    </div>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}} />
        </div>
    );
}
