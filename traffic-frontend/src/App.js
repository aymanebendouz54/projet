import React, { useState, useEffect } from 'react';
import Stats from './Stats';
import Login from './components/Login';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import {
  Cpu, Activity, BarChart3, Mail, Phone, Map as MapIcon,
  ChevronRight, CloudRain, AlertTriangle, Lightbulb, UploadCloud, MapPin, Search,
  Sun, Cloud, CloudLightning, Mic, Video, Clock, Leaf, MonitorPlay, X, Rocket,
  MessageSquare, Send, Palette, LogOut
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { GoogleMap, LoadScript, MarkerF, CircleF, TrafficLayer, DirectionsService, DirectionsRenderer, InfoWindowF } from '@react-google-maps/api';
import 'leaflet/dist/leaflet.css';
import './App.css';
import { MapContainer, TileLayer, Circle, CircleMarker, useMap, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet-routing-machine';

const GOOGLE_MAPS_API_KEY = "AIzaSyAJmbqgEggqywAx_n6rlt6OEg-GFgV7ir8";

const darkMapStyle = [
  { elementType: "geometry", stylers: [{ color: "#0f172a" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#0f172a" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#64748b" }] },
  { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#94a3b8" }] },
  { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#94a3b8" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#1e293b" }] },
  { featureType: "poi.park", elementType: "labels.text.fill", stylers: [{ color: "#10b981" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#1e293b" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#334155" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#94a3b8" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#334155" }] },
  { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#475569" }] },
  { featureType: "road.highway", elementType: "labels.text.fill", stylers: [{ color: "#cbd5e1" }] },
  { featureType: "transit", elementType: "geometry", stylers: [{ color: "#1e293b" }] },
  { featureType: "transit.station", elementType: "labels.text.fill", stylers: [{ color: "#94a3b8" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#020617" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#334155" }] },
  { featureType: "water", elementType: "labels.text.stroke", stylers: [{ color: "#020617" }] },
];

const GOOGLE_LIBRARIES = ["places"];

const GLOBAL_LOCKS = {};
let GLOBAL_EMERGENCY = false;

const normalizeName = (name) => name ? name.toLowerCase().replace(/[^a-z0-9]/g, "") : "";

const isPointLocked = (point) => {
  if (!point) return false;
  try {
    const savedLocks = JSON.parse(localStorage.getItem('traffic_locks') || '{}');
    const idLock = savedLocks[String(point.id)];
    const nameLock = savedLocks[normalizeName(point.name)];
    const now = Date.now();
    return (idLock && now < idLock) || (nameLock && now < nameLock);
  } catch (e) {
    return false;
  }
};

const setPointLock = (pointId, pointName, durationMs = 60000) => {
  try {
    const savedLocks = JSON.parse(localStorage.getItem('traffic_locks') || '{}');
    const expiry = Date.now() + durationMs;
    savedLocks[String(pointId)] = expiry;
    if (pointName) {
      savedLocks[normalizeName(pointName)] = expiry;
    }
    localStorage.setItem('traffic_locks', JSON.stringify(savedLocks));
  } catch (e) {
    console.error(e);
  }
};


const alertIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/564/564246.png',
  iconSize: [30, 30],
  iconAnchor: [15, 15]
});

const initialTrafficPoints = [
  {
    id: 1, name: "Casablanca - Zerktouni / Roudani", lat: 33.5855, lng: -7.6255, density: 92, status: "Critique", isProblematic: true, lanes: [
      { id: 'A', name: 'Bd. Zerktouni Nord', density: 95, light: 'red' },
      { id: 'B', name: 'Bd. Zerktouni Sud', density: 88, light: 'red' },
      { id: 'C', name: 'Bd. Brahim Roudani', density: 40, light: 'green' },
      { id: 'D', name: 'Av. Hassan II', density: 30, light: 'green' }
    ]
  },
  {
    id: 7, name: "Casablanca - Anfa / Zerktouni", lat: 33.5879, lng: -7.6328, density: 95, status: "Critique", isProblematic: true, lanes: [
      { id: 'A', name: 'Bd. d\'Anfa', density: 98, light: 'red' },
      { id: 'B', name: 'Bd. Zerktouni', density: 92, light: 'red' }
    ]
  },
  {
    id: 3, name: "Meknès - Bab Mansour", lat: 33.89325, lng: -5.56567, density: 92, status: "Critique", isProblematic: true, lanes: [
      { id: 'A', name: 'Place El Hedim', density: 95, light: 'red' },
      { id: 'B', name: 'Rue de la Marche Verte', density: 40, light: 'green' },
      { id: 'C', name: 'Bd. Mohammed V', density: 30, light: 'green' },
      { id: 'D', name: 'Av. Moulay Ismaïl', density: 85, light: 'red' }
    ]
  },
  {
    id: 9, name: "Meknès - Hamria", lat: 33.8980, lng: -5.5450, density: 88, status: "Critique", isProblematic: true, lanes: [
      { id: 'A', name: 'Rue de Paris', density: 90, light: 'red' },
      { id: 'B', name: 'Av. des FAR', density: 85, light: 'red' }
    ]
  },
  {
    id: 5, name: "Rabat - Agdal (France/Oumeir)", lat: 33.9982, lng: -6.8475, density: 94, status: "Critique", isProblematic: true, lanes: [
      { id: 'A', name: 'Av. Fal Ould Oumeir', density: 96, light: 'red' },
      { id: 'B', name: 'Av. de France', density: 92, light: 'red' },
      { id: 'C', name: 'Rue Oukaimeden', density: 50, light: 'green' },
      { id: 'D', name: 'Rue Aguelmane', density: 45, light: 'green' }
    ]
  },
  {
    id: 14, name: "Rabat - Hassan II / Bab Rouah", lat: 34.0145, lng: -6.8450, density: 75, status: "Chargé", isProblematic: true, lanes: [
      { id: 'A', name: 'Av. Hassan II', density: 80, light: 'red' },
      { id: 'B', name: 'Av. Ibn Toumert', density: 70, light: 'green' }
    ]
  },
  {
    id: 6, name: "Marrakech - Place de la Liberté", lat: 31.6358, lng: -8.0125, density: 95, status: "Critique", isProblematic: true, lanes: [
      { id: 'A', name: 'Av. Mohammed V', density: 98, light: 'red' },
      { id: 'B', name: 'Av. Abdelkrim Khattabi', density: 94, light: 'red' },
      { id: 'C', name: 'Rue de la Liberté', density: 60, light: 'green' },
      { id: 'D', name: 'Av. El Mansour Eddahbi', density: 55, light: 'green' }
    ]
  },
  {
    id: 11, name: "Tanger - Place des Nations", lat: 35.7669, lng: -5.8000, density: 91, status: "Critique", isProblematic: true, lanes: [
      { id: 'A', name: 'Av. Mohammed V', density: 93, light: 'red' },
      { id: 'B', name: 'Av. d\'Espagne', density: 89, light: 'red' }
    ]
  },
  {
    id: 12, name: "Fès - Place de Florence", lat: 34.0419, lng: -4.9997, density: 93, status: "Critique", isProblematic: true, lanes: [
      { id: 'A', name: 'Av. Hassan II', density: 95, light: 'red' },
      { id: 'B', name: 'Rue de l\'Irak', density: 91, light: 'red' },
      { id: 'C', name: 'Av. de la Liberté', density: 40, light: 'green' },
      { id: 'D', name: 'Rue d\'Espagne', density: 35, light: 'green' }
    ]
  },
  {
    id: 13, name: "Agadir - Hassan II / Prince Héritier", lat: 30.4137, lng: -9.5935, density: 89, status: "Critique", isProblematic: true, lanes: [
      { id: 'A', name: 'Av. Hassan II', density: 92, light: 'red' },
      { id: 'B', name: 'Av. du Prince Héritier', density: 86, light: 'red' }
    ]
  }
];

const moroccanCities = [
  { name: "Casablanca", lat: 33.5731, lng: -7.5898, zoom: 12 },
  { name: "Meknès", lat: 33.8930, lng: -5.5540, zoom: 13 },
  { name: "Rabat", lat: 34.0209, lng: -6.8416, zoom: 13 },
  { name: "Marrakech", lat: 31.6295, lng: -7.9811, zoom: 12 },
  { name: "Tanger", lat: 35.7595, lng: -5.8340, zoom: 12 },
  { name: "Fès", lat: 34.0331, lng: -5.0003, zoom: 12 },
  { name: "Agadir", lat: 30.4278, lng: -9.5981, zoom: 12 }
];

const PageTransition = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    transition={{ duration: 0.5, ease: "easeOut" }}
  >
    {children}
  </motion.div>
);

const LPRLabel = () => {
  const n = Math.floor(10000 + Math.random() * 90000);
  const l = ["A", "B", "D", "H"][Math.floor(Math.random() * 4)];
  const r = Math.floor(1 + Math.random() * 99);
  return <div className="yolo-plate">{n} | {l} | {r}</div>;
};

const LogoutConfirmModal = ({ onConfirm, onCancel }) => (
  <AnimatePresence>
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 9999, backdropFilter: 'blur(8px)'
      }}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        style={{
          background: 'linear-gradient(135deg, #0f172a, #1e293b)',
          border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: '20px',
          padding: '2.5rem',
          maxWidth: '420px',
          width: '90%',
          textAlign: 'center',
          boxShadow: '0 25px 60px rgba(239,68,68,0.2), 0 0 0 1px rgba(255,255,255,0.05)'
        }}
      >
        <div style={{
          width: '70px', height: '70px', borderRadius: '50%',
          background: 'rgba(239,68,68,0.15)', border: '2px solid rgba(239,68,68,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 1.5rem'
        }}>
          <LogOut size={32} color="#ef4444" />
        </div>
        <h3 style={{ color: '#fff', fontSize: '1.4rem', fontWeight: '700', margin: '0 0 0.5rem' }}>
          Déconnexion
        </h3>
        <p style={{ color: '#94a3b8', fontSize: '0.95rem', margin: '0 0 2rem', lineHeight: 1.6 }}>
          Êtes-vous sûr de vouloir quitter le système de surveillance ?
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1, padding: '0.8rem 1.5rem',
              background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px', color: '#cbd5e1',
              cursor: 'pointer', fontSize: '0.95rem', fontWeight: '600',
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => e.target.style.background = 'rgba(255,255,255,0.12)'}
            onMouseLeave={e => e.target.style.background = 'rgba(255,255,255,0.07)'}
          >
            Annuler
          </button>
          <button
            onClick={onConfirm}
            style={{
              flex: 1, padding: '0.8rem 1.5rem',
              background: 'linear-gradient(135deg, #ef4444, #dc2626)',
              border: 'none', borderRadius: '12px',
              color: '#fff', cursor: 'pointer',
              fontSize: '0.95rem', fontWeight: '700',
              boxShadow: '0 4px 15px rgba(239,68,68,0.4)',
              transition: 'all 0.2s',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <LogOut size={16} /> Déconnecter
          </button>
        </div>
      </motion.div>
    </motion.div>
  </AnimatePresence>
);

const Navbar = ({ onLogout }) => {
  const location = useLocation();
  const [theme, setTheme] = useState('#00f0ff');
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  useEffect(() => {
    document.documentElement.style.setProperty('--primary', theme);
  }, [theme]);

  return (
    <>
      {showLogoutModal && (
        <LogoutConfirmModal
          onConfirm={() => { setShowLogoutModal(false); onLogout(); }}
          onCancel={() => setShowLogoutModal(false)}
        />
      )}
      <nav className="navbar glass-panel no-print" style={{ borderRadius: 0, borderTop: 'none', borderLeft: 'none', borderRight: 'none' }}>
        <div className="nav-container">
          <Link to="/" className="logo" style={{ textDecoration: 'none', color: 'white' }}>
            <Cpu color="var(--primary)" size={32} />
            <span>MAROC <span className="gradient-text" style={{ backgroundImage: `linear-gradient(45deg, var(--primary), #fff)` }}>TRAFIC IA</span></span>
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div className="nav-links">
              <Link to="/" className={location.pathname === '/' ? 'active' : ''}>Accueil</Link>
              <Link to="/map" className={location.pathname === '/map' ? 'active' : ''}>Carte en Direct</Link>
              <Link to="/stats" className={location.pathname === '/stats' ? 'active' : ''}>Statistiques</Link>
              <button
                onClick={() => setShowLogoutModal(true)}
                className="btn-logout"
                style={{
                  display: 'flex', alignItems: 'center', gap: '7px',
                  padding: '7px 16px', borderRadius: '10px',
                  background: 'rgba(239,68,68,0.1)',
                  border: '1px solid rgba(239,68,68,0.3)',
                  color: '#ef4444', cursor: 'pointer',
                  fontSize: '0.9rem', fontWeight: '600',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'rgba(239,68,68,0.2)';
                  e.currentTarget.style.borderColor = 'rgba(239,68,68,0.6)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'rgba(239,68,68,0.1)';
                  e.currentTarget.style.borderColor = 'rgba(239,68,68,0.3)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <LogOut size={15} /> Déconnexion
              </button>
            </div>

            <div style={{ display: 'flex', gap: '8px', padding: '5px', background: 'rgba(255,255,255,0.05)', borderRadius: '20px' }}>
              <Palette size={16} color="#999" />
              <div onClick={() => setTheme('#00f0ff')} style={{ width: '15px', height: '15px', borderRadius: '50%', background: '#00f0ff', cursor: 'pointer', border: theme === '#00f0ff' ? '2px solid #fff' : '' }}></div>
              <div onClick={() => setTheme('#10b981')} style={{ width: '15px', height: '15px', borderRadius: '50%', background: '#10b981', cursor: 'pointer', border: theme === '#10b981' ? '2px solid #fff' : '' }}></div>
              <div onClick={() => setTheme('#7000ff')} style={{ width: '15px', height: '15px', borderRadius: '50%', background: '#7000ff', cursor: 'pointer', border: theme === '#7000ff' ? '2px solid #fff' : '' }}></div>
            </div>
          </div>
        </div>
      </nav>
    </>
  );
};

const speak = (text) => {
  if ('speechSynthesis' in window) {
    const utterance = new window.SpeechSynthesisUtterance(text);
    utterance.lang = 'fr-FR';
    utterance.rate = 1.1;
    window.speechSynthesis.speak(utterance);
  }
};

const DigitalClock = () => {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#00f0ff', fontSize: '0.9rem', fontWeight: '700', background: 'rgba(0, 240, 255, 0.1)', padding: '5px 12px', borderRadius: '20px', border: '1px solid rgba(0, 240, 255, 0.2)' }}>
      <Clock size={14} />
      <span>{time.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
    </div>
  );
};

const NewsTicker = () => (
  <div className="news-ticker-container no-print">
    <div className="news-ticker-content">
      <span>🚀 ALERTE IA : Trafic fluide détecté sur le pont Hassan II à Rabat.</span>
      <span>🚦 INFO : Prolongation automatique des feux verts à Casablanca (Zerktouni).</span>
      <span>⚠️ ACCIDENT : Un accident a été signalé à Meknès, Bab Mansour. Déviation conseillée.</span>
      <span>🌧️ MÉTÉO : Pluie détectée à Tanger, l'IA conseille de réduire la vitesse de 20%.</span>
      <span>🔮 PRÉDICTION : Hausse du trafic prévue à 18h00 dans tous les centres-villes.</span>
      <span>🚀 ALERTE IA : Trafic fluide détecté sur le pont Hassan II à Rabat.</span>
      <span>🚦 INFO : Prolongation automatique des feux verts à Casablanca (Zerktouni).</span>
      <span>⚠️ ACCIDENT : Un accident a été signalé à Meknès, Bab Mansour. Déviation conseillée.</span>
    </div>
  </div>
);

const AIChatAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([{ type: 'ai', text: "Bonjour ! Je suis l'IA de surveillance. Comment puis-je vous aider ?" }]);
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!input.trim()) return;
    const newMessages = [...messages, { type: 'user', text: input }];
    setMessages(newMessages);
    setInput("");

    setTimeout(() => {
      let reply = "Je traite votre demande. Le trafic est actuellement sous contrôle.";
      if (input.toLowerCase().includes("trafic")) reply = "Le trafic est dense à Casablanca mais fluide à Meknès.";
      if (input.toLowerCase().includes("accident")) reply = "Un accident a été détecté. Le drône est en route.";
      setMessages(prev => [...prev, { type: 'ai', text: reply }]);
    }, 1000);
  };

  return (
    <>
      <div className="chat-trigger no-print" onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? <X color="#000" /> : <MessageSquare color="#000" />}
      </div>
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ opacity: 0, y: 20, scale: 0.8 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.8 }} className="ai-chat-bubble no-print">
            <div className="chat-header">
              <span>IA Assistant</span>
              <X size={18} style={{ cursor: 'pointer' }} onClick={() => setIsOpen(false)} />
            </div>
            <div className="chat-body">
              {messages.map((m, i) => <div key={i} className={`chat-msg msg-${m.type}`}>{m.text}</div>)}
            </div>
            <div className="chat-input-area">
              <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()} className="chat-input" placeholder="Posez une question..." />
              <button onClick={handleSend} style={{ background: 'none', border: 'none', color: '#00f0ff', cursor: 'pointer' }}><Send size={18} /></button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

const DroneHUD = () => (
  <div className="drone-overlay">
    <div className="drone-hud-corner corner-tl"></div>
    <div className="drone-hud-corner corner-tr"></div>
    <div className="drone-hud-corner corner-bl"></div>
    <div className="drone-hud-corner corner-br"></div>
    <div className="drone-crosshair">
      <div style={{ position: 'absolute', top: -30, color: '#ef4444', fontSize: '0.8rem' }}>AI TARGET LOCK</div>
    </div>
    <div className="drone-data">
      ALT: 154m<br />
      SPD: 12km/h<br />
      BAT: 84%<br />
      GPS: 33.8930 / -5.5540
    </div>
    <div className="drone-scanning-text">RECONNAISSANCE DRÔNE EN COURS...</div>
  </div>
);

const TrafficStream = ({ light, density }) => {
  const [cars, setCars] = useState([]);

  useEffect(() => {
    const carCount = Math.max(1, Math.floor((density || 50) / 10));
    const newCars = Array.from({ length: carCount }).map((_, i) => ({
      id: i,
      offset: Math.random() * 100,
      lane: Math.floor(Math.random() * 2),
      color: ['#00f0ff', '#7000ff', '#10b981', '#ffffff'][Math.floor(Math.random() * 4)]
    }));

    setCars(prev => {
      if (prev.length > 0 && Math.abs(prev.length * 10 - density) < 20 && light === 'green') {
        return prev;
      }
      return newCars;
    });
  }, [density, light]);

  return (
    <div className="traffic-stream">
      {cars.map((car) => (
        <motion.div
          key={car.id}
          className="car-sim"
          initial={{ x: `${car.offset}%`, opacity: 0 }}
          animate={light === 'green' ? {
            x: ['-10%', '110%'],
            opacity: 1,
            transition: {
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              ease: "linear",
              delay: Math.random() * 2
            }
          } : {
            x: `${car.offset}%`,
            opacity: 1
          }}
          style={{
            top: car.lane === 0 ? '35%' : '55%',
            zIndex: 10
          }}
        >
          <div className="car-body" style={{ backgroundColor: car.color, boxShadow: `0 0 15px ${car.color}` }}>
            <div className="car-headlights"></div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

const IntersectionControlModal = ({ intersection, onClose, onOptimize, onManualControl }) => {
  if (!intersection) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="control-room-modal intersection-alert-modal"
    >
      <div className="control-room-header">
        <div>
          <h2 style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
            <AlertTriangle size={32} /> ALERTE CRITIQUE : {intersection.name}
          </h2>
          <p style={{ color: '#94a3b8', margin: '5px 0 0 42px' }}>Analyse multi-voies en temps réel par l'IA</p>
        </div>
        <button onClick={onClose} className="btn-action" style={{ width: 'auto', background: 'rgba(255,255,255,0.1)' }}>
          <X size={20} /> Fermer
        </button>
      </div>

      <div className="cctv-grid">
        {(intersection.lanes || []).map((lane) => (
          <div key={lane.id} className="cctv-container lane-camera" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1449824913935-59a10b8d2000?auto=format&fit=crop&q=80&sig=${lane.id}')` }}>
            <div className="cctv-overlay"></div>

            <div className="camera-location-label">
              <MapPin size={14} color="#00f0ff" /> {lane.name}
            </div>

            <div className="cctv-recording">REC</div>

            <TrafficStream light={lane.light} density={lane.density} />

            <div className="lane-status-overlay" style={{ flexDirection: 'column', gap: '8px', alignItems: 'stretch' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="lane-info">
                  <span className="lane-label">VOIE {lane.id}</span>
                  <span className="lane-density">Densité: {lane.density}%</span>
                </div>

                <div className="lane-traffic-light">
                  <div className={`light ${lane.light === 'red' ? 'red-active' : ''}`}></div>
                  <div className={`light ${lane.light === 'green' ? 'green-active' : ''}`}></div>
                </div>
              </div>

              {onManualControl && (
                <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                  <button 
                    className="btn-manual-light"
                    onClick={(e) => {
                      e.stopPropagation();
                      onManualControl(intersection.id, lane.id, 'green');
                    }} 
                    style={{
                      flex: 1,
                      padding: '6px 10px',
                      fontSize: '0.75rem',
                      fontWeight: '800',
                      borderRadius: '6px',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                      transition: 'all 0.2s ease',
                      background: lane.light === 'green' ? '#10b981' : 'rgba(16, 185, 129, 0.1)',
                      color: lane.light === 'green' ? '#000' : '#34d399',
                      boxShadow: lane.light === 'green' ? '0 0 10px rgba(16, 185, 129, 0.4)' : 'none'
                    }}
                  >
                    🟢 Vert
                  </button>
                  <button 
                    className="btn-manual-light"
                    onClick={(e) => {
                      e.stopPropagation();
                      onManualControl(intersection.id, lane.id, 'red');
                    }} 
                    style={{
                      flex: 1,
                      padding: '6px 10px',
                      fontSize: '0.75rem',
                      fontWeight: '800',
                      borderRadius: '6px',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                      transition: 'all 0.2s ease',
                      background: lane.light === 'red' ? '#ef4444' : 'rgba(239, 68, 68, 0.1)',
                      color: lane.light === 'red' ? '#fff' : '#f87171',
                      boxShadow: lane.light === 'red' ? '0 0 10px rgba(239, 68, 68, 0.4)' : 'none'
                    }}
                  >
                    🔴 Rouge
                  </button>
                </div>
              )}
            </div>

            {lane.light === 'green' && intersection.manualOverride && (
              <div className="ai-status-badge">AI CONTROL ACTIVE</div>
            )}

            {lane.density > 80 && lane.light === 'red' && (
              <div className="critical-warning">CONGESTION DÉTECTÉE</div>
            )}
          </div>
        ))}
      </div>

      <div className="modal-footer" style={{ marginTop: '20px', display: 'flex', justifyContent: 'center' }}>
        <button onClick={() => onOptimize(intersection.id)} className="btn-main" style={{ padding: '1.2rem 4rem', fontSize: '1.2rem' }}>
          <Rocket size={24} /> LANCER L'OPTIMISATION IA
        </button>
      </div>
    </motion.div>
  );
};

const Home = () => (
  <PageTransition>
    <div className="home-page">
      <header className="hero">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
            <div style={{ background: 'rgba(0, 240, 255, 0.1)', padding: '10px 20px', borderRadius: '50px', border: '1px solid rgba(0, 240, 255, 0.3)', color: '#00f0ff', fontSize: '0.9rem', fontWeight: '600' }}>
              ✨ Intégration YOLOv8 de Nouvelle Génération
            </div>
          </div>
          <h1 className="hero-title">Trafic Intelligent<br />Pour <span className="gradient-text">Villes Marocaines</span></h1>
          <p className="hero-desc">
            Système d'analyse avancé piloté par l'IA utilisant les flux de caméras en temps réel pour optimiser la circulation, réduire les émissions et prédire la congestion.
          </p>
          <Link to="/map" className="btn-main">
            Lancer le Tableau de Bord <ChevronRight size={20} />
          </Link>
        </motion.div>
      </header>

      <section className="features-section">
        <motion.div whileHover={{ y: -10 }} className="feature-card glass-panel">
          <Activity color="#00f0ff" size={48} style={{ marginBottom: '1rem' }} />
          <h3>Suivi en Temps Réel</h3>
          <p>Analyse instantanée des caméras d'intersection en utilisant des modèles de détection IA de pointe.</p>
        </motion.div>
        <motion.div whileHover={{ y: -10 }} className="feature-card glass-panel">
          <MapIcon color="#10b981" size={48} style={{ marginBottom: '1rem' }} />
          <h3>Cartographie Intelligente</h3>
          <p>Visualisation dynamique de la densité des véhicules sur les axes majeurs et itinéraires stratégiques.</p>
        </motion.div>
        <motion.div whileHover={{ y: -10 }} className="feature-card glass-panel">
          <BarChart3 color="#7000ff" size={48} style={{ marginBottom: '1rem' }} />
          <h3>Données Prédictives</h3>
          <p>Rapports complets et prévisions IA pour la gestion de la congestion aux heures de pointe.</p>
        </motion.div>
      </section>
    </div>
  </PageTransition>
);

const LiveMap = ({ token, user }) => {
  const isAdmin = user && (
    user.role === 'admin' || 
    user.is_admin === true || 
    user.is_admin === 1 || 
    String(user.role).toLowerCase() === 'admin'
  );
  const [trafficPoints, setTrafficPoints] = useState([]); // Empty initially
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [yoloResult, setYoloResult] = useState(null);
  const [selectedCity, setSelectedCity] = useState("Toutes");
  const [userPos, setUserPos] = useState(null);
  const [destinationPos, setDestinationPos] = useState(null);
  const [directionsResponse, setDirectionsResponse] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [mapConfig, setMapConfig] = useState({ center: [33.5892, -7.6337], zoom: 12 });
  const [incidents, setIncidents] = useState([]);
  const [currentNeighborhood, setCurrentNeighborhood] = useState("votre zone");
  const [weather, setWeather] = useState({ temp: 18, desc: "Pluie Légère", icon: "CloudRain", color: "#60a5fa", effect: "Adhérence -15%" });

  const [isEmergencyMode, setIsEmergencyMode] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [predictionHour, setPredictionHour] = useState(0);
  const [showControlRoom, setShowControlRoom] = useState(false);
  const [isDroneMode, setIsDroneMode] = useState(false);
  const [isSyncPaused, setIsSyncPaused] = useState(false);
  const [isAutoPilot, setIsAutoPilot] = useState(false);
  const [locks, setLocks] = useState({});
  const [selectedIntersectionId, setSelectedIntersectionId] = useState(null);

  const [newCamName, setNewCamName] = useState("");
  const [newCamCity, setNewCamCity] = useState("Meknès");
  const [newCamLat, setNewCamLat] = useState("");
  const [newCamLng, setNewCamLng] = useState("");
  const [newCamLanesCount, setNewCamLanesCount] = useState(2);
  const [isSubmitCamLoading, setIsSubmitCamLoading] = useState(false);

  const handleAddCameraSubmit = async (e) => {
    e.preventDefault();
    if (!newCamName || !newCamLat || !newCamLng) {
      alert("Veuillez remplir tous les champs obligatoires (Nom, Lat, Lng).");
      return;
    }

    const latVal = parseFloat(newCamLat);
    const lngVal = parseFloat(newCamLng);

    if (isNaN(latVal) || isNaN(lngVal)) {
      alert("La latitude et la longitude doivent être des nombres valides.");
      return;
    }

    setIsSubmitCamLoading(true);

    const generatedId = Date.now();
    
    const lanesList = [];
    const laneLetters = ['A', 'B', 'C', 'D'];
    for (let i = 0; i < newCamLanesCount; i++) {
      const letter = laneLetters[i % laneLetters.length];
      lanesList.push({
        id: letter,
        name: `Voie ${letter} - Dir. ${newCamCity}`,
        density: Math.floor(30 + Math.random() * 50),
        light: 'red'
      });
    }

    const newPoint = {
      id: generatedId,
      name: `${newCamCity} - ${newCamName}`,
      city: newCamCity,
      lat: latVal,
      lng: lngVal,
      density: Math.round(lanesList.reduce((acc, l) => acc + l.density, 0) / lanesList.length),
      status: "Normal",
      isProblematic: false,
      lanes: lanesList
    };

    setTrafficPoints(prev => {
      if (prev.some(p => normalizeName(p.name) === normalizeName(newPoint.name))) {
        return prev;
      }
      return [...prev, newPoint];
    });
    try {
      const stored = JSON.parse(localStorage.getItem('added_cameras') || '[]');
      if (!stored.some(p => normalizeName(p.name) === normalizeName(newPoint.name))) {
        stored.push(newPoint);
        localStorage.setItem('added_cameras', JSON.stringify(stored));
      }
    } catch (err) {
      console.error("Local storage save error", err);
    }

    speak(`Nouvelle caméra ajoutée avec succès à ${newCamCity}`);

    try {
      const response = await fetch('http://127.0.0.1:8000/api/cameras', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newPoint.name,
          city: newCamCity,
          lat: latVal,
          lng: lngVal,
          lanes_count: newCamLanesCount
        })
      });
      if (response.ok) {
        console.log("Camera synced with Laravel Backend.");
      }
    } catch (error) {
      console.warn("Laravel Backend offline, camera registered locally.");
    } finally {
      setIsSubmitCamLoading(false);
      setNewCamName("");
      setNewCamLat("");
      setNewCamLng("");
      setNewCamLanesCount(2);
    }
  };

  useEffect(() => {
    GLOBAL_EMERGENCY = isEmergencyMode;
  }, [isEmergencyMode]);

  useEffect(() => {
    Object.keys(locks).forEach(k => GLOBAL_LOCKS[k] = locks[k]);
  }, [locks]);

  const [startQuery, setStartQuery] = useState("");
  const [endQuery, setEndQuery] = useState("");
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);
  const [isRouteCongested, setIsRouteCongested] = useState(false);

  useEffect(() => {
    setDirectionsResponse(null);
  }, [userPos, destinationPos]);

  const calculateRoute = React.useCallback((start, end) => {
    if (!window.google || !window.google.maps) {
      console.warn("Google Maps API not ready for routing");
      return;
    }

    const directionsService = new window.google.maps.DirectionsService();
    directionsService.route(
      {
        origin: { lat: start[0], lng: start[1] },
        destination: { lat: end[0], lng: end[1] },
        travelMode: window.google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === window.google.maps.DirectionsStatus.OK) {
          setDirectionsResponse(result);
        } else {
          console.error(`Directions request failed due to ${status}`);
        }
      }
    );
  }, []);

  useEffect(() => {
    if (userPos && destinationPos) {
      calculateRoute(userPos, destinationPos);
    } else {
      setDirectionsResponse(null);
    }
  }, [userPos, destinationPos, calculateRoute]);

  useEffect(() => {
    const normalizeName = (name) => name ? name.toLowerCase().replace(/[^a-z0-9]/g, "") : "";

    const fetchTrafficData = async () => {
      try {
        const response = await fetch('http://127.0.0.1:8000/api/traffic-data');
        if (!response.ok) throw new Error("Backend offline");
        const data = await response.json();

        if (data.length === 0) {
          setTrafficPoints(initialTrafficPoints);
          return;
        }

        setTrafficPoints(currentPoints => {
          const now = Date.now();
          const isEmergency = GLOBAL_EMERGENCY;

          let storedCams = [];
          try {
            storedCams = JSON.parse(localStorage.getItem('added_cameras') || '[]');
          } catch (e) {}
          const basePoints = [...initialTrafficPoints, ...storedCams];

          const updatedPoints = basePoints.map(bp => {
            const existing = currentPoints.find(ep => 
              String(ep.id) === String(bp.id) || 
              normalizeName(ep.name) === normalizeName(bp.name)
            );
            
            const p = data.find(bk => 
              String(bk.id) === String(bp.id) || 
              normalizeName(bk.name) === normalizeName(bp.name)
            );

            if (p) {
              if (isEmergency) {
                return {
                  ...bp,
                  density: 10,
                  status: "Priorité Urgence",
                  isProblematic: false,
                  lanes: (p.lanes || bp.lanes || []).map(l => ({ ...l, density: 10, light: 'green', light_status: 'green' }))
                };
              }

              const isLocked = isPointLocked(existing || bp);

              if (isLocked && existing) {
                return {
                  ...existing,
                  lat: parseFloat(p.lat) || bp.lat,
                  lng: parseFloat(p.lng) || bp.lng
                };
              }

              return {
                ...bp,
                lat: parseFloat(p.lat) || bp.lat,
                lng: parseFloat(p.lng) || bp.lng,
                density: p.density,
                status: p.status,
                isProblematic: p.density > 80,
                lanes: (p.lanes || bp.lanes || []).map(l => ({
                  id: l.id,
                  name: l.direction_name || l.name,
                  density: l.density,
                  light: l.light_status || l.light
                }))
              };
            }

            return existing || bp;
          });

          const extraPoints = data.filter(bk => 
            !basePoints.some(bp => 
              String(bp.id) === String(bk.id) || 
              normalizeName(bp.name) === normalizeName(bk.name)
            )
          ).map(p => {
            const existing = currentPoints.find(ep => 
              String(ep.id) === String(p.id) || 
              normalizeName(ep.name) === normalizeName(p.name)
            );

            if (isEmergency) {
              return {
                id: p.id,
                name: p.name,
                city: p.city || "Toutes",
                lat: parseFloat(p.lat),
                lng: parseFloat(p.lng),
                density: 10,
                status: "Priorité Urgence",
                isProblematic: false,
                lanes: (p.lanes || []).map(l => ({ ...l, density: 10, light: 'green', light_status: 'green' }))
              };
            }

            const isLocked = isPointLocked(existing || p);

            if (isLocked && existing) {
              return {
                ...existing,
                lat: parseFloat(p.lat),
                lng: parseFloat(p.lng)
              };
            }

            return {
              id: p.id,
              name: p.name,
              city: p.city || "Toutes",
              lat: parseFloat(p.lat),
              lng: parseFloat(p.lng),
              density: p.density,
              status: p.status,
              isProblematic: p.density > 80,
              lanes: (p.lanes || []).map(l => ({
                id: l.id,
                name: l.direction_name || l.name,
                density: l.density,
                light: l.light_status || l.light
              }))
            };
          });

          return [...updatedPoints, ...extraPoints];
        });
      } catch (error) {
        console.warn("Backend Laravel non détecté, utilisation des données locales.");
        setTrafficPoints(currentPoints => {
          const isEmergency = GLOBAL_EMERGENCY;
          const now = Date.now();
          
          let source = currentPoints;
          if (source.length === 0) {
            let storedCams = [];
            try {
              storedCams = JSON.parse(localStorage.getItem('added_cameras') || '[]');
            } catch (e) {}
            source = [...initialTrafficPoints, ...storedCams];
          }
          
          return source.map(p => {
            if (isEmergency) {
              return { ...p, density: 10, status: "Priorité Urgence", isProblematic: false, lanes: (p.lanes || []).map(l => ({ ...l, density: 10, light: 'green' })) };
            }

            const isLocked = isPointLocked(p);

            if (isLocked) {
              return p;
            }

            if (p.manualOverride) {
              const original = initialTrafficPoints.find(ip => 
                String(ip.id) === String(p.id) || 
                normalizeName(ip.name) === normalizeName(p.name)
              );
              if (original) return original;
            }
            return p;
          });
        });
      }
    };

    fetchTrafficData();
    const interval = setInterval(fetchTrafficData, 5000);
    return () => clearInterval(interval);
  }, []);

  const selectedIntersectionAlert = trafficPoints.find(p => p.id === selectedIntersectionId);

  useEffect(() => {
    if (!userPos) return;
    const fetchNeighborhood = async () => {
      try {
        const response = await axios.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${userPos[0]}&lon=${userPos[1]}&zoom=18&accept-language=fr`);
        if (response.data) {
          const addr = response.data.address || {};
          const displayName = response.data.display_name ? response.data.display_name.split(',')[0] : "";

          const area = addr.neighbourhood || addr.suburb || addr.city_district || addr.road || displayName || addr.town || addr.city || "votre zone";
          setCurrentNeighborhood(area);
        }

        const weatherRes = await axios.get(`https://api.open-meteo.com/v1/forecast?latitude=${userPos[0]}&longitude=${userPos[1]}&current_weather=true`);
        if (weatherRes.data && weatherRes.data.current_weather) {
          const w = weatherRes.data.current_weather;
          const code = w.weathercode;
          let desc = "Dégagé"; let icon = "Sun"; let color = "#fbbf24"; let effect = "Trafic Fluide";

          if (code === 1 || code === 2 || code === 3) {
            desc = "Nuageux"; icon = "Cloud"; color = "#9ca3af"; effect = "Visibilité Normale";
          } else if (code >= 45 && code <= 48) {
            desc = "Brouillard"; icon = "Cloud"; color = "#d1d5db"; effect = "Visibilité Réduite";
          } else if (code >= 51 && code <= 67) {
            desc = "Pluvieux"; icon = "CloudRain"; color = "#60a5fa"; effect = "Adhérence -15%";
          } else if (code >= 71 && code <= 77) {
            desc = "Neige"; icon = "CloudRain"; color = "#e5e7eb"; effect = "Risque de Glissade";
          } else if (code >= 95) {
            desc = "Orage"; icon = "CloudLightning"; color = "#a855f7"; effect = "Danger / Ralentissement";
          }
          setWeather({ temp: Math.round(w.temperature), desc, icon, color, effect });
        }

      } catch (error) {
        console.error("API error:", error);
      }
    };
    fetchNeighborhood();
  }, [userPos]);

  useEffect(() => {
    if (!isAutoPilot) return;

    const autoCheck = () => {
      const now = Date.now();
      trafficPoints.forEach(p => {
        const isLocked = locks[String(p.id)] && now < locks[String(p.id)];
        if (p.density > 80 && !isLocked) {
          console.log(`AI Auto-Pilot: Optimizing intersection ${p.name}`);
          handleOptimize(p.id, true);
        }
      });
    };

    const interval = setInterval(autoCheck, 3000);
    return () => clearInterval(interval);
  }, [isAutoPilot, trafficPoints]);

  const handleOptimize = async (id, isAuto = false) => {
    console.log("Lancement de l'optimisation pour l'ID:", id);
    if (!isAuto) speak("Optimisation IA lancée. Priorité accordée aux voies les plus denses.");

    const point = trafficPoints.find(p => String(p.id) === String(id));
    if (!point || !point.lanes) return;

    const maxDensity = Math.max(...point.lanes.map(l => l.density), 1);
    const newLanes = point.lanes.map(l => {
      const shouldBeGreen = (l.density >= 70 || l.density === maxDensity);
      return {
        ...l,
        density: shouldBeGreen ? 10 : l.density,
        light: shouldBeGreen ? 'green' : 'red'
      };
    });

    const expiry = Date.now() + 300000;
    setPointLock(id, point.name, 300000);
    GLOBAL_LOCKS[String(id)] = expiry;
    setLocks(prev => ({ ...prev, [String(id)]: expiry }));

    setTimeout(() => {
      setTrafficPoints(prev => prev.map(p => String(p.id) === String(id) ? { ...p, manualOverride: false } : p));
    }, 60000);

    setTrafficPoints(prev => prev.map(p => {
      if (String(p.id) === String(id)) {
        return {
          ...p,
          density: 30,
          status: isAuto ? "Auto-Optimisé" : "Optimisé",
          isProblematic: false,
          lanes: newLanes,
          manualOverride: true
        };
      }
      return p;
    }));

    try {
      await fetch(`http://127.0.0.1:8000/api/optimize/${id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
    } catch (error) {
      console.warn("Backend sync failed.");
    }
  };

  const handleManualControl = async (intersectionId, laneId, targetLight) => {
    console.log(`Contrôle manuel : intersection ${intersectionId}, voie ${laneId} -> ${targetLight}`);
    speak(`Voie ${laneId} forcée au ${targetLight === 'green' ? 'vert' : 'rouge'}`);

    const point = trafficPoints.find(p => String(p.id) === String(intersectionId));
    if (!point || !point.lanes) return;

    const newLanes = point.lanes.map(l => {
      if (String(l.id) === String(laneId)) {
        return {
          ...l,
          light: targetLight,
          density: targetLight === 'green' ? 10 : l.density
        };
      }
      return l;
    });

    const expiry = Date.now() + 300000;
    setPointLock(intersectionId, point.name, 300000);
    GLOBAL_LOCKS[String(intersectionId)] = expiry;
    setLocks(prev => ({ ...prev, [String(intersectionId)]: expiry }));

    setTrafficPoints(prev => prev.map(p => {
      if (String(p.id) === String(intersectionId)) {
        const anyCritical = newLanes.some(l => l.density > 80 && l.light === 'red');
        return {
          ...p,
          lanes: newLanes,
          manualOverride: true,
          density: Math.round(newLanes.reduce((acc, l) => acc + l.density, 0) / newLanes.length),
          status: "Manuel",
          isProblematic: anyCritical
        };
      }
      return p;
    }));

    try {
      await fetch(`http://127.0.0.1:8000/api/cameras/${intersectionId}/lane-control`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          lane_id: laneId,
          light_status: targetLight
        })
      });
    } catch (error) {
      console.warn("Backend manual control sync failed.");
    }
  };


  const handleCalculateRoute = async () => {
    if (!startQuery || !endQuery) return;
    setIsCalculatingRoute(true);
    setIsRouteCongested(false);
    setDirectionsResponse(null); 

    try {
      const startRes = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${startQuery}&limit=1`);
      const endRes = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${endQuery}&limit=1`);

      if (startRes.data[0] && endRes.data[0]) {
        const s = [parseFloat(startRes.data[0].lat), parseFloat(startRes.data[0].lon)];
        const e = [parseFloat(endRes.data[0].lat), parseFloat(endRes.data[0].lon)];

        setUserPos(s);
        setDestinationPos(e);
        setMapConfig({ center: s, zoom: 14 });
        const hasCongestion = trafficPoints.some(p => p.density > 80);
        setIsRouteCongested(hasCongestion);

        if (hasCongestion) {
          speak("Attention. L'itinéraire direct présente des zones de forte congestion affichées en rouge. L'IA a optimisé votre trajet via les voies fluides en Cyan.");
        } else {
          speak("Itinéraire calculé. La route est fluide. Bonne route !");
        }
      }
    } catch (err) {
      console.error("Geocoding error", err);
    } finally {
      setIsCalculatingRoute(false);
    }
  };

  const handleFixAllInZone = () => {
    if (selectedCity === "Toutes") {
      alert("Veuillez sélectionner une zone spécifique d'abord.");
      return;
    }

    speak(`Lancement de l'optimisation globale pour la zone ${selectedCity}. Traitement de tous les points critiques en cours.`);

    const now = Date.now();
    const expiry = now + 300000;
    
    setLocks(prev => {
      const next = { ...prev };
      setTrafficPoints(currentPoints => currentPoints.map(p => {
        if (p.name.includes(selectedCity)) {
          next[String(p.id)] = expiry;
          GLOBAL_LOCKS[String(p.id)] = expiry;
          let updatedLanes = p.lanes;
          if (p.lanes) {
            updatedLanes = p.lanes.map(l => ({ ...l, density: 10, light: 'green' }));
          }
          return { ...p, density: 10, status: "Optimisé", isProblematic: false, lanes: updatedLanes, manualOverride: true };
        }
        return p;
      }));
      return next;
    });
  };

  useEffect(() => {
    if (predictionHour === 0) return;
    const now = Date.now();
    setTrafficPoints(prev => prev.map(p => {
      if (isEmergencyMode) return p;

      if (locks[String(p.id)] && now < locks[String(p.id)]) return p;

      let targetDensity = 50;
      if (predictionHour >= 1 && predictionHour <= 2) targetDensity = 75;
      else if (predictionHour >= 3 && predictionHour <= 5) targetDensity = 95;
      else if (predictionHour >= 6 && predictionHour <= 8) targetDensity = 45;
      else targetDensity = 15;

      targetDensity += Math.floor(Math.random() * 10) - 5;
      targetDensity = Math.max(0, Math.min(100, targetDensity));

      let newStatus = targetDensity > 80 ? "Critique" : targetDensity > 50 ? "Chargé" : targetDensity > 20 ? "Normal" : "Fluide";
      return { ...p, density: targetDensity, status: newStatus };
    }));
  }, [predictionHour]);

  const handleVoiceCommand = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("La commande vocale n'est pas supportée sur ce navigateur (utilisez Chrome).");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'fr-FR';
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      setSearchQuery(transcript);
      speak(`Recherche de ${transcript} en cours.`);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognition.start();
  };

  const toggleEmergency = () => {
    if (isEmergencyMode) {
      speak("Mode d'urgence désactivé. Reprise du cycle de trafic normal.");
    } else {
      speak("Alerte Urgence activée. Priorité accordée au véhicule de secours. Tous les feux passent au vert.");
      
      setTrafficPoints(prev => prev.map(p => ({
        ...p,
        density: 10,
        status: "Priorité Urgence",
        isProblematic: false,
        manualOverride: true
      })));
    }
    const nextEmergency = !isEmergencyMode;
    GLOBAL_EMERGENCY = nextEmergency;
    setIsEmergencyMode(nextEmergency);
  };

  const toggleDrone = () => {
    if (!isDroneMode) {
      speak("Lancement du drône de reconnaissance autonome vers la zone d'incident.");
      if (incidents.length > 0) {
        setMapConfig({ center: [incidents[incidents.length - 1].lat, incidents[incidents.length - 1].lng], zoom: 18 });
      } else if (userPos) {
        setMapConfig({ center: userPos, zoom: 18 });
      }
    }
    setIsDroneMode(!isDroneMode);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setYoloResult(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setIsAnalyzing(true);
    setYoloResult(null);

    const formData = new FormData();
    formData.append('image', selectedFile);

    try {
      const response = await fetch('http://127.0.0.1:8000/api/process-traffic', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();

      setIsAnalyzing(false);
      setYoloResult({
        car_count: data.car_count,
        confidence: 94,
        status: data.density_status
      });
      speak(`Analyse terminée. ${data.car_count} véhicules détectés par YOLOv8.`);
    } catch (error) {
      console.error("Erreur d'analyse IA:", error);
      setIsAnalyzing(false);
      alert("Erreur de communication avec le service IA.");
    }
  };

  const getMyLocation = () => {
    const applyMockLocation = () => {
      setUserPos([33.8935, -5.5545]);
      setMapConfig({ center: [33.8935, -5.5545], zoom: 16 });
      alert("Le navigateur a bloqué le vrai GPS (très commun sur PC). Utilisation de votre position simulée à Meknès pour la démo !");
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setUserPos([lat, lng]);
          setMapConfig({ center: [lat, lng], zoom: 16 });
        },
        () => applyMockLocation(),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      applyMockLocation();
    }
  };

  const handleSearchDestination = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    speak(`Recherche d'itinéraire vers ${searchQuery} lancée.`);
    try {
      const response = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&countrycodes=ma`);
      if (response.data && response.data.length > 0) {
        const { lat, lon } = response.data[0];
        const newDest = [parseFloat(lat), parseFloat(lon)];
        setDestinationPos(newDest);
        setMapConfig({ center: newDest, zoom: 16 });
      } else {
        alert("Lieu introuvable. Essayez d'ajouter le nom de la ville (ex: 'Marjane, Meknès').");
      }
    } catch (error) {
      console.error(error);
      alert("Erreur de connexion lors de la recherche.");
    } finally {
      setIsSearching(false);
    }
  };

  const reportIncident = () => {
    const centerLat = userPos ? userPos[0] : mapConfig.center[0];
    const centerLng = userPos ? userPos[1] : mapConfig.center[1];
    const offsetLat = (Math.random() - 0.5) * 0.0002;
    const offsetLng = (Math.random() - 0.5) * 0.0002;

    const newIncident = {
      lat: centerLat + offsetLat,
      lng: centerLng + offsetLng,
      type: "Accident"
    };

    speak("Alerte : Accident signalé par un utilisateur. Calcul d'un itinéraire de déviation par l'intelligence artificielle.");
    setIncidents(prev => [...prev, newIncident]);
  };

  const getColor = (d) => d > 80 ? "#ef4444" : d > 50 ? "#f59e0b" : "#10b981";

  const WeatherIcon = () => {
    if (weather.icon === "Sun") return <Sun color={weather.color} size={28} />;
    if (weather.icon === "Cloud") return <Cloud color={weather.color} size={28} />;
    if (weather.icon === "CloudLightning") return <CloudLightning color={weather.color} size={28} />;
    return <CloudRain color={weather.color} size={28} />;
  };

  return (
    <PageTransition>
      <NewsTicker />
      <AIChatAssistant />
      <div className={`map-view ${isEmergencyMode ? 'emergency-mode-active' : ''}`}>
        <div className="sidebar no-print">
          <div className="sidebar-title">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Cpu size={24} /> <span>Centre IA</span>
            </div>
            <DigitalClock />
          </div>

          {isAdmin && (
            <div className="glass-box">
              <div className="weather-widget" style={{ marginBottom: '15px' }}>
                <div className="weather-info">
                  <WeatherIcon />
                  <div>
                    <div style={{ fontWeight: 'bold' }}>{weather.desc}</div>
                    <div className="weather-desc">{weather.effect}</div>
                  </div>
                </div>
                <div className="weather-temp">{weather.temp}°C</div>
              </div>
              <div className="ai-insight">
                <Lightbulb color="#f59e0b" size={24} style={{ flexShrink: 0 }} />
                <p><strong>Alerte IA:</strong> Conditions actuelles : <b>{weather.desc}</b> près de <b style={{ color: '#00f0ff' }}>{currentNeighborhood}</b>. {weather.effect}.</p>
              </div>
            </div>
          )}

          {!isAdmin && (
            <div className="glass-box">
              <h4 style={{ color: '#fff', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}><MapPin size={18} /> Navigation</h4>
              <div className="input-group">
                <button onClick={getMyLocation} className="btn-action btn-primary" style={{ marginBottom: '8px' }}>
                  📍 Ma Position (Départ)
                </button>
                <div style={{ display: 'flex', gap: '5px' }}>
                  <input
                    type="text"
                    className="styled-input"
                    placeholder="Ex: Bab Mansour, Meknès"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearchDestination()}
                  />
                  <button onClick={handleVoiceCommand} className={`btn-mic ${isListening ? 'listening' : ''}`} title="Parler à l'IA">
                    <Mic size={18} />
                  </button>
                  <button onClick={handleSearchDestination} className="btn-action btn-primary" style={{ width: 'auto', padding: '0 15px' }} disabled={isSearching}>
                    {isSearching ? <div className="loader-spinner"></div> : <Search size={18} />}
                  </button>
                </div>
              </div>

              {destinationPos && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="eco-report">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
                    <Leaf size={16} color="#34d399" />
                    <strong>Rapport Écologique IA</strong>
                  </div>
                  <p style={{ margin: 0 }}>
                    Trajet optimisé : Vous avez évité 2 zones de congestion. <br />
                    <strong>Émissions réduites : -18% CO₂</strong><br />
                    <em>Temps d'attente aux feux estimé : -4 min</em>
                  </p>
                </motion.div>
              )}

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button onClick={reportIncident} className="btn-action btn-warning" style={{ flex: 1, padding: '10px 5px', fontSize: '0.85rem' }}>
                  <AlertTriangle size={16} /> Accident
                </button>
                <button onClick={toggleEmergency} className={`btn-action btn-emergency ${isEmergencyMode ? 'active' : ''}`} style={{ flex: 1, padding: '10px 5px', fontSize: '0.85rem' }}>
                  <Activity size={16} /> Ambulance
                </button>
                <button onClick={toggleDrone} className={`btn-action ${isDroneMode ? 'btn-danger' : 'btn-primary'}`} style={{ flex: 1, padding: '10px 5px', fontSize: '0.85rem', background: isDroneMode ? '#ef4444' : '' }}>
                  <Rocket size={16} /> Drône
                </button>
              </div>

              {(() => {
                const avgDensity = trafficPoints.reduce((acc, p) => acc + p.density, 0) / trafficPoints.length;
                let lightColor = "green";
                let lightMessage = "Trafic Fluide : Cycle Vert Standard (30s)";
                if (isEmergencyMode) {
                  lightColor = "green";
                  lightMessage = "Priorité Secours : Feu Vert Forcé !";
                } else if (avgDensity > 70) {
                  lightColor = "red";
                  lightMessage = "Trafic Critique : Prolongation du Feu Vert à 60s";
                } else if (avgDensity > 40) {
                  lightColor = "yellow";
                  lightMessage = "Trafic Chargé : Cycle Adaptatif Activé";
                }

                return (
                  <div className="smart-light-container">
                    <div className="traffic-light">
                      <div className={`light-bulb red ${lightColor === 'red' ? 'active' : ''}`}></div>
                      <div className={`light-bulb yellow ${lightColor === 'yellow' ? 'active' : ''}`}></div>
                      <div className={`light-bulb green ${lightColor === 'green' ? 'active' : ''}`}></div>
                    </div>
                    <div className="smart-light-status">
                      <strong style={{ color: '#00f0ff' }}>Contrôleur de Feux</strong><br />
                      {lightMessage}
                    </div>
                    <button
                      onClick={() => {
                        setIsAutoPilot(!isAutoPilot);
                        if (!isAutoPilot) speak("Auto-pilote IA activé. Gestion autonome du trafic en cours.");
                        else speak("Auto-pilote désactivé.");
                      }}
                      className={`btn-autopilot ${isAutoPilot ? 'active' : ''}`}
                    >
                      {isAutoPilot ? 'AUTO ON' : 'AUTO OFF'}
                    </button>
                  </div>
                );
              })()}

            </div>
          )}

          {isAdmin && (
            <div className="glass-box">
              <h4 style={{ color: '#fff', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}><Video size={18} /> Caméra IA en Direct</h4>

              <div className="cctv-container">
                <div className="cctv-overlay"></div>
                <div className="cctv-recording">REC</div>

                <motion.div
                  className="yolo-box"
                  animate={{ x: [0, 100, 200, 300], y: [50, 60, 50, 40], scale: [1, 1.2, 0.8, 0.5], opacity: [0, 1, 1, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                  style={{ width: '60px', height: '40px', left: '10%', top: '50%' }}
                >
                  <div className="yolo-label">Voiture 98%</div>
                  <LPRLabel />
                </motion.div>

                <motion.div
                  className="yolo-box"
                  animate={{ x: [300, 150, 0, -50], y: [100, 110, 120, 130], scale: [0.5, 1, 1.5, 2], opacity: [0, 1, 1, 0] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "linear", delay: 1 }}
                  style={{ width: '40px', height: '30px', left: '80%', top: '30%' }}
                >
                  <div className="yolo-label" style={{ background: '#f59e0b' }}>Camion 92%</div>
                  <LPRLabel />
                </motion.div>
              </div>

              <div style={{ marginTop: '15px' }}>
                <input type="file" id="traffic-upload" hidden onChange={handleImageChange} accept="image/*" />
                <label htmlFor="traffic-upload" className="upload-label" style={{ display: 'flex', justifyContent: 'center', background: 'rgba(255,255,255,0.05)' }}>
                  <UploadCloud size={20} />
                  {selectedFile ? "Changer l'Image" : "Analyser une Image Locale"}
                </label>

                {previewUrl && (
                  <div className="upload-preview" style={{ marginTop: '10px' }}>
                    <img src={previewUrl} alt="preview" />
                    {isAnalyzing && <div className="scanning-overlay"></div>}
                  </div>
                )}

                {previewUrl && !isAnalyzing && !yoloResult && (
                  <button onClick={handleUpload} className="btn-action btn-primary" style={{ marginTop: '10px', width: '100%' }}>
                    Lancer l'Analyse YOLO sur l'Image
                  </button>
                )}

                {isAnalyzing && (
                  <button disabled className="btn-action" style={{ marginTop: '10px', width: '100%', background: 'rgba(255,255,255,0.1)' }}>
                    <div className="loader-spinner"></div> Analyse en cours...
                  </button>
                )}

                {yoloResult && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="btn-action btn-success" style={{ marginTop: '10px', width: '100%', cursor: 'default' }}>
                    Détecté : {yoloResult.car_count} Véhicules ({yoloResult.confidence}% Précis)
                  </motion.div>
                )}
              </div>

              <button onClick={() => setShowControlRoom(true)} className="btn-action btn-primary" style={{ marginTop: '15px', width: '100%' }}>
                <MonitorPlay size={18} /> Ouvrir la Salle de Contrôle
              </button>
            </div>
          )}

          {isAdmin && (
            <div className="glass-box" style={{ marginTop: '10px' }}>
              <h4 style={{ color: '#fff', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MapPin size={18} color="#00f0ff" /> 📍 Ajouter une Caméra
              </h4>
              <form onSubmit={handleAddCameraSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div className="input-group" style={{ marginBottom: '5px' }}>
                  <input
                    type="text"
                    className="styled-input"
                    placeholder="Nom de l'intersection (ex: Hamria 2)"
                    value={newCamName}
                    onChange={(e) => setNewCamName(e.target.value)}
                    required
                  />
                </div>
                <div className="input-group" style={{ marginBottom: '5px' }}>
                  <select
                    className="styled-select"
                    value={newCamCity}
                    onChange={(e) => setNewCamCity(e.target.value)}
                  >
                    {moroccanCities.map(city => (
                      <option key={city.name} value={city.name}>{city.name}</option>
                    ))}
                  </select>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <div className="input-group" style={{ flex: 1, marginBottom: '5px' }}>
                    <input
                      type="text"
                      className="styled-input"
                      placeholder="Latitude (ex: 33.8960)"
                      value={newCamLat}
                      onChange={(e) => setNewCamLat(e.target.value)}
                      required
                    />
                  </div>
                  <div className="input-group" style={{ flex: 1, marginBottom: '5px' }}>
                    <input
                      type="text"
                      className="styled-input"
                      placeholder="Longitude (ex: -5.5480)"
                      value={newCamLng}
                      onChange={(e) => setNewCamLng(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="input-group" style={{ marginBottom: '10px' }}>
                  <label style={{ color: '#94a3b8', fontSize: '0.8rem', marginBottom: '4px' }}>Nombre de voies :</label>
                  <select
                    className="styled-select"
                    value={newCamLanesCount}
                    onChange={(e) => setNewCamLanesCount(parseInt(e.target.value))}
                  >
                    <option value={2}>2 Voies</option>
                    <option value={3}>3 Voies</option>
                    <option value={4}>4 Voies</option>
                  </select>
                </div>
                <button
                  type="submit"
                  className="btn-action btn-primary"
                  disabled={isSubmitCamLoading}
                  style={{ padding: '10px', fontSize: '0.9rem' }}
                >
                  {isSubmitCamLoading ? <div className="loader-spinner"></div> : "Enregistrer la Caméra"}
                </button>
              </form>
            </div>
          )}

          {!isAdmin && (
            <div className="glass-box" style={{ marginTop: '10px' }}>
              <h4 style={{ color: '#fff', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MapPin size={18} color="#00f0ff" /> Navigation Intelligente
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: '10px', top: '12px', width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}></div>
                  <input
                    className="styled-input"
                    style={{ paddingLeft: '30px', fontSize: '0.85rem' }}
                    placeholder="Point de départ..."
                    value={startQuery}
                    onChange={(e) => setStartQuery(e.target.value)}
                  />
                </div>
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: '10px', top: '12px', width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444' }}></div>
                  <input
                    className="styled-input"
                    style={{ paddingLeft: '30px', fontSize: '0.85rem' }}
                    placeholder="Destination..."
                    value={endQuery}
                    onChange={(e) => setEndQuery(e.target.value)}
                  />
                </div>
                <button
                  onClick={handleCalculateRoute}
                  disabled={isCalculatingRoute}
                  className="btn-action btn-primary"
                  style={{ marginTop: '5px' }}
                >
                  {isCalculatingRoute ? <div className="loader-spinner"></div> : <><Search size={16} /> Calculer l'Itinéraire IA</>}
                </button>

                {isRouteCongested && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ color: '#ef4444', fontSize: '0.75rem', fontWeight: 'bold', textAlign: 'center', marginTop: '5px' }}>
                    ⚠️ Zone de congestion détectée sur le trajet !
                  </motion.div>
                )}
              </div>
            </div>
          )}

          {!isAdmin && (
            <div className="glass-box" style={{ marginTop: '10px', flexGrow: 0 }}>
              <h4 style={{ color: '#fff', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={18} color="#00f0ff" /> Prédiction IA (Temps)
              </h4>
              <div style={{ padding: '0 10px' }}>
                <input
                  type="range"
                  min="0" max="12"
                  value={predictionHour}
                  onChange={(e) => setPredictionHour(parseInt(e.target.value))}
                  className="styled-slider"
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#00f0ff', fontSize: '0.85rem', marginTop: '8px', fontWeight: 'bold' }}>
                  <span>{predictionHour === 0 ? "Temps Réel" : `+${predictionHour}H`}</span>
                  <span>
                    {predictionHour === 0 ? "Actuel" :
                      predictionHour <= 2 ? "Hausse" :
                        predictionHour <= 5 ? "Heure de Pointe" :
                          predictionHour <= 8 ? "Baisse" : "Trafic de Nuit"}
                  </span>
                </div>
              </div>
            </div>
          )}

          {isAdmin && (
            <div className="glass-box" style={{ flexGrow: 1, marginTop: '10px' }}>
              <h4 style={{ color: '#fff', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MapIcon size={18} color="#00f0ff" /> Gestion par Zone
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <select
                  onChange={(e) => {
                    const cityName = e.target.value;
                    setSelectedCity(cityName);
                    if (cityName !== "Toutes") {
                      const city = moroccanCities.find(c => c.name === cityName);
                      if (city) {
                        setMapConfig({ center: [city.lat, city.lng], zoom: city.zoom });
                        speak(`Déplacement vers la zone ${cityName}.`);
                      }
                    } else {
                      setMapConfig({ center: [33.5892, -7.6337], zoom: 12 });
                    }
                  }}
                  className="styled-select"
                >
                  <option value="Toutes">Toutes les Régions (Maroc)</option>
                  {moroccanCities.map(city => (
                    <option key={city.name} value={city.name}>{city.name}</option>
                  ))}
                </select>

                {selectedCity !== "Toutes" && (
                  <button onClick={handleFixAllInZone} className="btn-action btn-success" style={{ padding: '8px', fontSize: '0.85rem' }}>
                    <Rocket size={16} /> Optimiser la Zone {selectedCity}
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '15px' }}>
                <AnimatePresence>
                  {trafficPoints
                    .filter(p => selectedCity === "Toutes" || p.name.includes(selectedCity))
                    .map(p => (
                      <motion.div
                        layout
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        key={p.id}
                        className="point-card"
                      >
                        <div className="point-header">
                          <span><span className="live-dot" style={{ backgroundColor: getColor(p.density) }}></span>{p.name}</span>
                          <span className="status-badge" style={{ color: getColor(p.density), background: `${getColor(p.density)}20` }}>{p.status}</span>
                        </div>
                        <div className="progress-bg">
                          <div className="progress-fill" style={{ width: `${p.density}%`, background: getColor(p.density), boxShadow: `0 0 10px ${getColor(p.density)}` }}></div>
                        </div>
                        <div className="point-footer">
                          <span>Densité: {p.density}%</span>
                          <span>Précision IA: 98%</span>
                        </div>
                      </motion.div>
                    ))}
                </AnimatePresence>
              </div>
            </div>
          )}
        </div>

        <div className="map-container-main">
          {isDroneMode && <DroneHUD />}
          <LoadScript googleMapsApiKey={GOOGLE_MAPS_API_KEY} libraries={GOOGLE_LIBRARIES}>
            <GoogleMap
              mapContainerStyle={{ height: '100%', width: '100%' }}
              center={{ lat: mapConfig.center[0], lng: mapConfig.center[1] }}
              zoom={mapConfig.zoom}
              options={{
                styles: darkMapStyle,
                disableDefaultUI: false,
                zoomControl: true,
              }}
            >
              <TrafficLayer />

              {userPos && (
                <MarkerF
                  position={{ lat: userPos[0], lng: userPos[1] }}
                  label="🏠"
                />
              )}

              {directionsResponse && (
                <DirectionsRenderer
                  options={{
                    directions: directionsResponse,
                    polylineOptions: {
                      strokeColor: isRouteCongested ? "#ef4444" : "#00f0ff",
                      strokeWeight: 6,
                    }
                  }}
                />
              )}

              {isAdmin && trafficPoints
                .filter(p => selectedCity === "Toutes" || p.name.includes(selectedCity))
                .map(p => (
                  <React.Fragment key={p.id}>
                    <CircleF
                      center={{ lat: parseFloat(p.lat) || 33.5892, lng: parseFloat(p.lng) || -7.6337 }}
                      radius={Math.max(100, p.density * 5)}
                      options={{
                        strokeColor: p.isProblematic ? '#ef4444' : getColor(p.density),
                        strokeOpacity: 0.8,
                        strokeWeight: 2,
                        fillColor: p.isProblematic ? '#ef4444' : getColor(p.density),
                        fillOpacity: 0.35,
                      }}
                      onClick={() => setSelectedIntersectionId(p.id)}
                    />
                    {p.isProblematic && (
                      <MarkerF
                        position={{ lat: parseFloat(p.lat) || 33.5892, lng: parseFloat(p.lng) || -7.6337 }}
                        onClick={() => setSelectedIntersectionId(p.id)}
                        icon={{
                          url: 'https://cdn-icons-png.flaticon.com/512/564/564246.png',
                          scaledSize: new window.google.maps.Size(30, 30),
                          anchor: new window.google.maps.Point(15, 15)
                        }}
                      />
                    )}
                  </React.Fragment>
                ))}

              {incidents.map((inc, idx) => (
                <MarkerF
                  key={idx}
                  position={{ lat: inc.lat, lng: inc.lng }}
                  icon={{
                    url: 'https://cdn-icons-png.flaticon.com/512/564/564246.png',
                    scaledSize: new window.google.maps.Size(30, 30)
                  }}
                />
              ))}
            </GoogleMap>
          </LoadScript>
        </div>

        <AnimatePresence>
          {selectedIntersectionId && (
            <IntersectionControlModal
              intersection={selectedIntersectionAlert}
              onClose={() => setSelectedIntersectionId(null)}
              onOptimize={handleOptimize}
              onManualControl={handleManualControl}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showControlRoom && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="control-room-modal"
            >
              <div className="control-room-header">
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: 0, color: '#00f0ff' }}>
                  <MonitorPlay size={28} /> Centre de Commande Visuel (4 Régions)
                </h2>
                <button onClick={() => setShowControlRoom(false)} className="btn-action" style={{ width: 'auto', background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', borderColor: '#ef4444' }}>
                  <X size={20} /> Fermer
                </button>
              </div>

              <div className="cctv-grid">
                <div className="cctv-container" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1517331568853-2bf910d55e2e?auto=format&fit=crop&q=80')" }}>
                  <div className="cctv-overlay"></div>
                  <div className="cctv-recording">CAM 1 - CASA (Zerktouni)</div>
                  <motion.div className="yolo-box" animate={{ x: [0, 200], y: [150, 150] }} transition={{ duration: 3, repeat: Infinity }} style={{ width: '80px', height: '50px', left: '20%', top: '0%' }}>
                    <div className="yolo-label">Bus 99%</div>
                    <LPRLabel />
                  </motion.div>
                </div>
                <div className="cctv-container" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1494587416117-f102a2ac0a8d?auto=format&fit=crop&q=80')" }}>
                  <div className="cctv-overlay"></div>
                  <div className="cctv-recording">CAM 2 - RABAT (Agdal)</div>
                  <motion.div className="yolo-box" animate={{ x: [400, 0], y: [100, 100], scale: [0.5, 1.5] }} transition={{ duration: 4, repeat: Infinity }} style={{ width: '50px', height: '40px', left: '0%', top: '0%' }}>
                    <div className="yolo-label">Voiture 87%</div>
                    <LPRLabel />
                  </motion.div>
                </div>
                <div className="cctv-container" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1519999482648-25049ddd37b1?auto=format&fit=crop&q=80')" }}>
                  <div className="cctv-overlay"></div>
                  <div className="cctv-recording">CAM 3 - TANGER (Port)</div>
                  <motion.div className="yolo-box" animate={{ x: [100, 300], y: [50, 100] }} transition={{ duration: 2.5, repeat: Infinity }} style={{ width: '120px', height: '80px', left: '10%', top: '0%' }}>
                    <div className="yolo-label" style={{ background: '#f59e0b' }}>Camion 95%</div>
                    <LPRLabel />
                  </motion.div>
                </div>
                <div className="cctv-container" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1543465077-db45d34b88a5?auto=format&fit=crop&q=80')" }}>
                  <div className="cctv-overlay"></div>
                  <div className="cctv-recording">CAM 4 - MEKNÈS (Hamria)</div>
                  <motion.div className="yolo-box" animate={{ x: [200, 50], y: [80, 80] }} transition={{ duration: 3.5, repeat: Infinity }} style={{ width: '60px', height: '50px', left: '0%', top: '0%' }}>
                    <div className="yolo-label">Voiture 91%</div>
                    <LPRLabel />
                  </motion.div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </PageTransition>
  );
};

const App = () => {
  const [token, setToken] = useState(localStorage.getItem('admin_token'));
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('admin_user')));

  const handleLoginSuccess = (newToken, newUser) => {
    setToken(newToken);
    setUser(newUser);
  };

  const handleLogout = async () => {
    try {
      await axios.post('http://127.0.0.1:8000/api/logout', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (e) { }
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    setToken(null);
    setUser(null);
  };

  if (!token) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <Router>
      <div className="app-wrapper">
        <Navbar onLogout={handleLogout} />
        <div style={{ flexGrow: 1 }}>
          <AnimatePresence mode="wait">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/map" element={<LiveMap token={token} user={user} />} />
              <Route path="/stats" element={<Stats token={token} user={user} />} />
            </Routes>
          </AnimatePresence>
        </div>
        <footer className="footer-bar glass-panel" style={{ borderRadius: 0, borderBottom: 'none', borderLeft: 'none', borderRight: 'none' }}>
          <div className="footer-content">
            <p>© 2026 Smart Traffic IA - Développé par Aymane Bendouz & Yassin Bougoud</p>
            <div className="contact-info">
              <span><Mail size={16} /> aymanebendouz54@gmail.com</span>
              <span><Phone size={16} /> +212 614 616 760</span>
            </div>
          </div>
        </footer>
      </div>
    </Router>
  );
};

export default App;