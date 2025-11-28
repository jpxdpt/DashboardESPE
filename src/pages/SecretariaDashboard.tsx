import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { api } from '../lib/api';

interface Alert {
  id: string;
  userId: string;
  roomId: string;
  status: 'PENDING' | 'RESOLVED';
  createdAt: string;
  resolvedAt?: string;
  resolvedById?: string;
  professor: {
    id: string;
    name: string;
    email: string;
  };
  room: {
    id: string;
    name: string;
    number: string;
  };
  resolvedBy?: {
    id: string;
    name: string;
  };
}

export function SecretariaDashboard() {
  const { user, logout } = useAuth();
  const { socket } = useSocket();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'resolved'>('all');
  const [loading, setLoading] = useState(false);

  // Função para tocar alerta sonoro (alarme mais notável)
  const playNotificationSound = () => {
    try {
      // Cria um contexto de áudio (com suporte para navegadores antigos)
      interface WindowWithWebkit extends Window {
        webkitAudioContext?: typeof AudioContext;
      }
      const AudioContextClass = window.AudioContext || (window as WindowWithWebkit).webkitAudioContext;
      if (!AudioContextClass) {
        console.warn('AudioContext not supported');
        return;
      }
      const audioContext = new AudioContextClass();
      
      // Função auxiliar para criar um beep mais alto e longo
      const createBeep = (frequency: number, duration: number, startTime: number, volume: number = 0.8) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';
        
        // Envelope de volume mais alto e com fade in/out suave
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.03);
        gainNode.gain.linearRampToValueAtTime(volume, startTime + duration - 0.03);
        gainNode.gain.linearRampToValueAtTime(0, startTime + duration);
        
        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
      };
      
      const now = audioContext.currentTime;
      
      // Sequência mais longa e repetida de beeps altos para ser muito mais notável
      // Primeira sequência (3 beeps rápidos)
      createBeep(1000, 0.3, now, 0.9);           // Beep alto e longo
      createBeep(1200, 0.3, now + 0.35, 0.9);    // Beep ainda mais alto
      createBeep(800, 0.3, now + 0.7, 0.9);      // Beep médio-alto
      
      // Segunda sequência após pausa (repetição para garantir que é ouvido)
      createBeep(1000, 0.3, now + 1.2, 0.9);
      createBeep(1200, 0.3, now + 1.55, 0.9);
      createBeep(800, 0.3, now + 1.9, 0.9);
      
      // Terceira sequência final (mais aguda)
      createBeep(1500, 0.25, now + 2.4, 0.85);
      createBeep(1200, 0.25, now + 2.7, 0.85);
    } catch (error) {
      console.error('Erro ao reproduzir som de notificação:', error);
    }
  };

  useEffect(() => {
    loadAlerts();
  }, []);

  useEffect(() => {
    if (!socket) return;

    socket.on('alert:new', (newAlert: Alert) => {
      setAlerts((prev) => [newAlert, ...prev]);
      // Toca o som de notificação quando um novo alerta é recebido
      playNotificationSound();
    });

    socket.on('alert:resolved', (resolvedAlert: Alert) => {
      setAlerts((prev) =>
        prev.map((alert) => (alert.id === resolvedAlert.id ? resolvedAlert : alert))
      );
    });

    return () => {
      socket.off('alert:new');
      socket.off('alert:resolved');
    };
  }, [socket]);

  const loadAlerts = async () => {
    setLoading(true);
    try {
      const data = await api.get('/api/alerts');
      setAlerts(data);
    } catch (error) {
      console.error('Erro ao carregar alertas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (alertId: string) => {
    try {
      await api.patch(`/api/alerts/${alertId}/resolve`, {
        resolvedById: user?.id,
      });
    } catch (error) {
      console.error('Erro ao resolver alerta:', error);
    }
  };

  const filteredAlerts = alerts.filter((alert) => {
    if (filter === 'pending') return alert.status === 'PENDING';
    if (filter === 'resolved') return alert.status === 'RESOLVED';
    return true;
  });

  const pendingCount = alerts.filter((a) => a.status === 'PENDING').length;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold text-gray-900">Dashboard Secretaria</h1>
              <Link
                to="/admin/salas"
                className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                Gestão de Salas
              </Link>
              <Link
                to="/admin/utilizadores"
                className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                Gestão de Utilizadores
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">{user?.name}</span>
              <button
                onClick={logout}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Alertas</h2>
            <div className="flex space-x-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  filter === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setFilter('pending')}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  filter === 'pending'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                Pendentes ({pendingCount})
              </button>
              <button
                onClick={() => setFilter('resolved')}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  filter === 'resolved'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                Resolvidos
              </button>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8">A carregar...</div>
          ) : filteredAlerts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">Nenhum alerta encontrado</div>
          ) : (
            <div className="space-y-4">
              {filteredAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`bg-white shadow rounded-lg p-6 ${
                    alert.status === 'PENDING' ? 'border-l-4 border-red-500' : ''
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          Alerta de Ordem de Saída
                        </h3>
                        {alert.status === 'PENDING' && (
                          <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded">
                            Pendente
                          </span>
                        )}
                        {alert.status === 'RESOLVED' && (
                          <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
                            Resolvido
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600">
                        <strong>Professor:</strong> {alert.professor.name}
                      </p>
                      <p className="text-gray-600">
                        <strong>Sala:</strong> {alert.room.name}
                      </p>
                      <p className="text-sm text-gray-500 mt-2">
                        {new Date(alert.createdAt).toLocaleString('pt-PT')}
                      </p>
                      {alert.resolvedBy && (
                        <p className="text-sm text-gray-500 mt-1">
                          Resolvido por: {alert.resolvedBy.name} em{' '}
                          {new Date(alert.resolvedAt!).toLocaleString('pt-PT')}
                        </p>
                      )}
                    </div>
                    {alert.status === 'PENDING' && (
                      <button
                        onClick={() => handleResolve(alert.id)}
                        className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700"
                      >
                        Marcar como Resolvido
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

