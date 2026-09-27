import React, { useEffect, useState } from 'react';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { motion } from 'framer-motion';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler
} from 'chart.js';
import { ShieldAlert, TrendingUp, Zap, FileText, MapPin } from 'lucide-react';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Title, Tooltip, Legend, Filler
);

ChartJS.defaults.color = '#94a3b8';
ChartJS.defaults.font.family = "'Outfit', sans-serif";

const moroccanCities = [
  "Casablanca", "Meknès", "Rabat", "Marrakech", "Tanger", "Fès", "Agadir"
];

const Stats = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [selectedCity, setSelectedCity] = useState("Toutes");

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const getCityData = (city) => {
    const dataMap = {
      "Casablanca": {
        flow: [30, 95, 60, 70, 65, 85, 120, 90],
        congestion: [92, 85, 40, 30, 75],
        yolo: [60, 15, 15, 10],
        kpis: { total: "452,109", critical: "4", accuracy: "98.2%" }
      },
      "Meknès": {
        flow: [10, 45, 25, 30, 35, 55, 85, 40],
        congestion: [92, 88, 40, 30, 85],
        yolo: [75, 5, 15, 5],
        kpis: { total: "98,432", critical: "2", accuracy: "99.1%" }
      },
      "Rabat": {
        flow: [20, 80, 50, 55, 45, 65, 100, 70],
        congestion: [94, 92, 50, 45, 60],
        yolo: [70, 10, 15, 5],
        kpis: { total: "215,670", critical: "1", accuracy: "98.7%" }
      },
      "Toutes": {
        flow: [15, 85, 45, 60, 50, 75, 110, 65],
        congestion: [88, 45, 25, 95, 72],
        yolo: [65, 12, 18, 5],
        kpis: { total: "1,242,593", critical: "12", accuracy: "98.4%" }
      }
    };
    return dataMap[city] || dataMap["Toutes"];
  };

  const currentData = getCityData(selectedCity);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: '#f8fafc', font: { size: 13 } } },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        titleColor: '#00f0ff',
        bodyColor: '#fff',
        borderColor: '#00f0ff',
        borderWidth: 1,
        padding: 10,
      }
    },
    scales: {
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#94a3b8' }
      },
      x: {
        grid: { display: false },
        ticks: { color: '#94a3b8' }
      }
    }
  };

  const lineData = {
    labels: ['06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00'],
    datasets: [{
      label: `Débit Moyen - ${selectedCity} (Véhicules/min)`,
      data: currentData.flow,
      borderColor: '#00f0ff',
      backgroundColor: 'rgba(0, 240, 255, 0.2)',
      borderWidth: 3,
      tension: 0.4,
      fill: true,
      pointBackgroundColor: '#000',
      pointBorderColor: '#00f0ff',
      pointBorderWidth: 2,
      pointRadius: 4,
      pointHoverRadius: 6
    }]
  };

  const barData = {
    labels: selectedCity === "Toutes" ? ['Maarif', 'Hamria', 'Agdal', 'Guéliz', 'Port'] : ['Zone Nord', 'Zone Sud', 'Zone Est', 'Zone Ouest', 'Centre'],
    datasets: [{
      label: 'Congestion Actuelle %',
      data: currentData.congestion,
      backgroundColor: [
        'rgba(239, 68, 68, 0.8)',
        'rgba(245, 158, 11, 0.8)',
        'rgba(16, 185, 129, 0.8)',
        'rgba(16, 185, 129, 0.8)',
        'rgba(239, 68, 68, 0.8)'
      ],
      borderRadius: 6,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.1)'
    }]
  };

  const doughnutData = {
    labels: ['Voitures', 'Camions', 'Motos', 'Bus'],
    datasets: [{
      data: currentData.yolo,
      backgroundColor: ['#00f0ff', '#ef4444', '#f59e0b', '#7000ff'],
      borderColor: '#050505',
      borderWidth: 4,
      hoverOffset: 4
    }]
  };

  if (!isLoaded) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      style={{ padding: '3rem 5%', maxWidth: '1400px', margin: '0 auto', minHeight: 'calc(100vh - 150px)' }}
    >
      <div style={{ textAlign: 'center', marginBottom: '3rem', position: 'relative' }}>
        <h2 style={{ fontSize: '3rem', fontWeight: '800', margin: '0 0 10px 0' }}>
          Rapport <span className="gradient-text">{selectedCity === "Toutes" ? "National" : selectedCity}</span>
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem' }}>Analyse analytique avancée du trafic pilotée par l'IA.</p>
        
        <div className="no-print" style={{ marginTop: '20px', display: 'flex', justifyContent: 'center', gap: '15px' }}>
          <select 
            className="styled-select" 
            style={{ width: '250px' }}
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
          >
            <option value="Toutes">Toutes les Régions</option>
            {moroccanCities.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <button 
            onClick={handlePrint}
            className="btn-action btn-primary"
            style={{ width: 'auto', padding: '0 25px' }}
          >
            <FileText size={18} /> Exporter PDF
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
        <motion.div whileHover={{ y: -5 }} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: 'rgba(0, 240, 255, 0.1)', padding: '15px', borderRadius: '12px' }}><Zap color="#00f0ff" size={32} /></div>
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Véhicules Traités ({selectedCity})</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#fff' }}>{currentData.kpis.total}</div>
          </div>
        </motion.div>
        
        <motion.div whileHover={{ y: -5 }} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '15px', borderRadius: '12px' }}><ShieldAlert color="#ef4444" size={32} /></div>
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Nœuds Critiques</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#fff' }}>{currentData.kpis.critical}</div>
          </div>
        </motion.div>

        <motion.div whileHover={{ y: -5 }} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: 'rgba(112, 0, 255, 0.1)', padding: '15px', borderRadius: '12px' }}><TrendingUp color="#7000ff" size={32} /></div>
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Précision IA {selectedCity}</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#fff' }}>{currentData.kpis.accuracy}</div>
          </div>
        </motion.div>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '2rem' }}>
        
        <motion.div whileHover={{ scale: 1.01 }} className="glass-panel" style={{ padding: '2rem', height: '400px' }}>
          <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#00f0ff' }}></span>
            Analyse des Flux - {selectedCity}
          </h3>
          <div style={{ height: '300px' }}>
            <Line data={lineData} options={chartOptions} />
          </div>
        </motion.div>

        <motion.div whileHover={{ scale: 1.01 }} className="glass-panel" style={{ padding: '2rem', height: '400px' }}>
          <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#f59e0b' }}></span>
            Niveaux de Congestion par Quartier
          </h3>
          <div style={{ height: '300px' }}>
            <Bar data={barData} options={chartOptions} />
          </div>
        </motion.div>

        <motion.div whileHover={{ scale: 1.01 }} className="glass-panel" style={{ padding: '2rem', height: '400px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#7000ff' }}></span>
            Classification YOLOv8 ({selectedCity})
          </h3>
          <div style={{ flexGrow: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <div style={{ height: '280px', width: '280px' }}>
              <Doughnut data={doughnutData} options={{ ...chartOptions, maintainAspectRatio: false, cutout: '70%' }} />
            </div>
          </div>
        </motion.div>

      </div>
    </motion.div>
  );
};

export default Stats;