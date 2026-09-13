import { useState } from 'react';
import { ArrowRight, CheckCircle2, Eye, EyeOff, Lock, Mail, Shield, UserPlus, LogIn } from 'lucide-react';
import DotField from './DotField';

const createEmptyContact = () => ({ name: '', phone: '', relation: '' });

export function AuthScreen({ onSignUp, onSignIn }) {
  const [mode, setMode] = useState('choice');
  const [signup, setSignup] = useState({
    name: '',
    email: '',
    password: '',
    contacts: [createEmptyContact()]
  });
  const [signupError, setSignupError] = useState('');
  const [signinError, setSigninError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [signin, setSignin] = useState({ email: '', password: '' });
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showSigninPassword, setShowSigninPassword] = useState(false);

  const addEmergencyContact = () => {
    setSignup(prev => ({ ...prev, contacts: [...prev.contacts, createEmptyContact()] }));
  };

  const updateEmergencyContact = (index, field, value) => {
    setSignup(prev => ({
      ...prev,
      contacts: prev.contacts.map((contact, contactIndex) =>
        contactIndex === index ? { ...contact, [field]: value } : contact
      )
    }));
  };

  const removeEmergencyContact = index => {
    setSignup(prev => {
      const nextContacts = prev.contacts.filter((_, contactIndex) => contactIndex !== index);
      return { ...prev, contacts: nextContacts.length ? nextContacts : [createEmptyContact()] };
    });
  };

  const validEmergencyContact = contact => contact.name.trim() && contact.phone.trim() && contact.relation.trim();

  const submitSignup = async event => {
    event.preventDefault();
    const hasRequiredProfile = signup.name.trim() && signup.email.trim() && signup.password.trim();
    const hasEmergencyContact = signup.contacts.some(validEmergencyContact);

    if (!hasRequiredProfile || !hasEmergencyContact) {
      setSignupError('Please fill in your name, email, password, and at least one complete emergency contact with name, number, and relationship.');
      return;
    }

    setSignupError('');
    setSubmitting(true);
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...signup,
          name: signup.name.trim(),
          email: signup.email.trim(),
          contacts: signup.contacts.filter(validEmergencyContact)
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Unable to create your account.');
      const profileResponse = await fetch('/api/auth/me', { credentials: 'include' });
      onSignUp(await profileResponse.json());
    } catch (error) {
      setSignupError(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const submitSignin = async event => {
    event.preventDefault();
    if (!signin.email.trim() || !signin.password.trim()) return;
    setSigninError('');
    setSubmitting(true);
    try {
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(signin)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Unable to sign in.');
      const profileResponse = await fetch('/api/auth/me', { credentials: 'include' });
      onSignIn(await profileResponse.json());
    } catch (error) {
      setSigninError(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <DotField
        dotRadius={1.8}
        dotSpacing={12}
        cursorRadius={0}
        cursorForce={0}
        bulgeOnly={true}
        bulgeStrength={0}
        glowRadius={0}
        glowColor="#000000"
        gradientFrom="rgba(168, 85, 247, 0.18)"
        gradientTo="rgba(59, 130, 246, 0.08)"
      />
      <div className="auth-glow" />
      <div className="auth-panel">
        <div className="auth-brand">
          <Shield className="auth-brand-icon" />
          <div>
            <span className="auth-kicker">AllerSafe</span>
            <h1>Secure access</h1>
          </div>
        </div>

        {mode === 'choice' && (
          <>
            <div className="auth-copy">
              <p className="eyebrow">Welcome back</p>
              <h2>Continue to your allergen-safe workspace</h2>
            </div>

            <div className="auth-choice-grid">
              <button className="auth-option primary" onClick={() => setMode('signup')}>
                <UserPlus size={22} />
                <span>
                  <strong>Sign Up</strong>
                  <small>Create a new account</small>
                </span>
              </button>

              <button className="auth-option" onClick={() => setMode('signin')}>
                <LogIn size={22} />
                <span>
                  <strong>Sign In</strong>
                  <small>Access your saved profile</small>
                </span>
              </button>
            </div>
          </>
        )}

        {mode === 'signup' && (
          <form className="auth-form" onSubmit={submitSignup}>
            <div className="auth-copy compact">
              <p className="eyebrow">Create account</p>
              <h2>Let’s build your safer profile</h2>
            </div>

            <label className="field-group">
              <span className="label">Full name</span>
              <input
                className="field"
                value={signup.name}
                onChange={event => {
                  setSignup({ ...signup, name: event.target.value });
                  setSignupError('');
                }}
                placeholder="Enter your full name"
              />
            </label>

            <label className="field-group">
              <span className="label">Email</span>
              <div className="input-with-icon">
                <Mail size={16} />
                <input
                  type="email"
                  className="field"
                  value={signup.email}
                  onChange={event => {
                    setSignup({ ...signup, email: event.target.value });
                    setSignupError('');
                  }}
                  placeholder="you@example.com"
                />
              </div>
            </label>

            <label className="field-group">
              <span className="label">Password</span>
              <div className="input-with-icon">
                <Lock size={16} />
                <input
                  type={showSignupPassword ? 'text' : 'password'}
                  className="field password-field"
                  value={signup.password}
                  onChange={event => {
                    setSignup({ ...signup, password: event.target.value });
                    setSignupError('');
                  }}
                  placeholder="Create a secure password"
                />
                <button
                  type="button"
                  className="password-toggle"
                  aria-label={showSignupPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowSignupPassword(prev => !prev)}
                >
                  {showSignupPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </label>

            {signupError && (
              <div className="rounded-xl border border-red-500/50 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                {signupError}
              </div>
            )}

            <div className="field-group">
              <div className="flex items-center justify-between gap-3">
                <span className="label">Emergency contacts</span>
                <button type="button" className="text-button" onClick={addEmergencyContact}>
                  + Add another
                </button>
              </div>

              <div className="space-y-4 mt-3">
                {signup.contacts.map((contact, index) => (
                  <div key={index} className="rounded-2xl border border-slate-700/60 bg-slate-900/50 p-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="label">Contact {index + 1}</span>
                      {signup.contacts.length > 1 && (
                        <button type="button" className="text-button danger" onClick={() => removeEmergencyContact(index)}>
                          Remove
                        </button>
                      )}
                    </div>

                    <input
                      className="field"
                      value={contact.name}
                      onChange={event => {
                        updateEmergencyContact(index, 'name', event.target.value);
                        setSignupError('');
                      }}
                      placeholder="Contact name"
                    />

                    <input
                      className="field"
                      type="tel"
                      value={contact.phone}
                      onChange={event => {
                        updateEmergencyContact(index, 'phone', event.target.value);
                        setSignupError('');
                      }}
                      placeholder="Contact number"
                    />

                    <input
                      className="field"
                      value={contact.relation}
                      onChange={event => {
                        updateEmergencyContact(index, 'relation', event.target.value);
                        setSignupError('');
                      }}
                      placeholder="Relationship with you"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="auth-actions">
              <button type="button" className="secondary-button" onClick={() => setMode('choice')}>
                Back
              </button>
              {signupError && <div className="rounded-xl border border-red-500/50 bg-red-500/10 px-3 py-2 text-sm text-red-200">{signupError}</div>}

              <button type="submit" className="primary-button" disabled={submitting}>
                Create account <ArrowRight size={18} />
              </button>
            </div>
          </form>
        )}

        {mode === 'signin' && (
          <form className="auth-form" onSubmit={submitSignin}>
            <div className="auth-copy compact">
              <p className="eyebrow">Welcome back</p>
              <h2>Sign in to your workspace</h2>
            </div>

            <label className="field-group">
              <span className="label">Email</span>
              <div className="input-with-icon">
                <Mail size={16} />
                <input
                  type="email"
                  className="field"
                  value={signin.email}
                  onChange={event => setSignin({ ...signin, email: event.target.value })}
                  placeholder="you@example.com"
                />
              </div>
            </label>

            <label className="field-group">
              <span className="label">Password</span>
              <div className="input-with-icon">
                <Lock size={16} />
                <input
                  type={showSigninPassword ? 'text' : 'password'}
                  className="field password-field"
                  value={signin.password}
                  onChange={event => setSignin({ ...signin, password: event.target.value })}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  className="password-toggle"
                  aria-label={showSigninPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowSigninPassword(prev => !prev)}
                >
                  {showSigninPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </label>

            <div className="auth-meta">
              <span><CheckCircle2 size={15} /> Secure access</span>
              <button type="button" className="text-button">Forgot password?</button>
            </div>

            {signinError && <div className="rounded-xl border border-red-500/50 bg-red-500/10 px-3 py-2 text-sm text-red-200">{signinError}</div>}

            <div className="auth-actions">
              <button type="button" className="secondary-button" onClick={() => setMode('choice')}>
                Back
              </button>
              <button type="submit" className="primary-button" disabled={submitting}>
                Sign in <ArrowRight size={18} />
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
