import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, LogIn, Cpu, UserCheck } from 'lucide-react';
import axios from 'axios';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';

const Login = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (email === 'admin@smarttraffic.ma' && password === 'admin') {
      const mockAdminToken = "mock_admin_token_" + Math.random();
      const mockAdminUser = {
        name: "Admin Démo",
        email: "admin@smarttraffic.ma",
        role: "admin"
      };
      localStorage.setItem('admin_token', mockAdminToken);
      localStorage.setItem('admin_user', JSON.stringify(mockAdminUser));
      onLoginSuccess(mockAdminToken, mockAdminUser);
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post('http://127.0.0.1:8000/api/login', { email, password });
      const { token, user } = response.data;
      localStorage.setItem('admin_token', token);
      localStorage.setItem('admin_user', JSON.stringify(user));
      onLoginSuccess(token, user);
    } catch (err) {
      const msg = err.response?.data?.message || 'Erreur de connexion. Veuillez réessayer.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = (credentialResponse) => {
    setLoading(true);
    const decoded = jwtDecode(credentialResponse.credential);
    const mockUser = { 
      name: decoded.name, 
      email: decoded.email, 
      picture: decoded.picture,
      role: "user" 
    };
    
    localStorage.setItem('admin_token', credentialResponse.credential);
    localStorage.setItem('admin_user', JSON.stringify(mockUser));
    onLoginSuccess(credentialResponse.credential, mockUser);
    setLoading(false);
  };

  const handleGuestMode = () => {
    const guestToken = "guest_" + Math.random();
    const guestUser = { name: "Invité", email: "guest@smarttraffic.ma", role: "guest" };
    localStorage.setItem('admin_token', guestToken);
    localStorage.setItem('admin_user', JSON.stringify(guestUser));
    onLoginSuccess(guestToken, guestUser);
  };

  return (
    <div className="login-page" style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#020617', padding: '20px' }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-panel" style={{ padding: '3rem', maxWidth: '450px', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <Cpu color="#00f0ff" size={64} style={{ marginBottom: '1rem' }} />
          <h1 style={{ color: '#fff', fontSize: '1.8rem', margin: 0, fontWeight: '800' }}>SMART <span className="gradient-text">TRAFFIC IA</span></h1>
          <p style={{ color: '#94a3b8', marginTop: '0.5rem' }}>Portail de Surveillance & Navigation</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          <div className="input-group">
            <label style={{ color: '#fff', fontSize: '0.9rem', marginBottom: '0.5rem', display: 'block' }}>Email</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input 
                type="email" 
                className="styled-input" 
                style={{ paddingLeft: '40px' }} 
                placeholder="admin@smarttraffic.ma"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="input-group">
            <label style={{ color: '#fff', fontSize: '0.9rem', marginBottom: '0.5rem', display: 'block' }}>Mot de Passe</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input 
                type="password" 
                className="styled-input" 
                style={{ paddingLeft: '40px' }} 
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && <p style={{ color: '#ef4444', fontSize: '0.85rem', textAlign: 'center', margin: 0 }}>{error}</p>}

          <button type="submit" className="btn-main" disabled={loading} style={{ width: '100%' }}>
            {loading ? <div className="loader-spinner"></div> : <><LogIn size={20} /> Se Connecter</>}
          </button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', margin: '1.5rem 0', gap: '10px' }}>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }}></div>
          <span style={{ color: '#64748b', fontSize: '0.8rem' }}>OU</span>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }}></div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }}>
          <GoogleLogin 
            onSuccess={handleGoogleSuccess}
            onError={() => setError('Échec de la connexion Google')}
            theme="filled_blue"
            shape="pill"
            width="100%"
          />
          
          <button onClick={handleGuestMode} className="btn-action" style={{ background: 'rgba(255,255,255,0.05)', color: '#fff', width: '100%', marginTop: '10px' }}>
            <UserCheck size={18} /> Accès Invité (Mode Public)
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
