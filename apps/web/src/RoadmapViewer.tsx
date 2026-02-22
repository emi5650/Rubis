import React, { useState, useEffect } from 'react';

interface RoadmapItem {
  ID: string;
  Domaine: string;
  'Fonctionnalité': string;
  'Description': string;
  'Priorité': string;
  'Statut': string;
  'Prédécesseurs': string;
  "Directives d'implémentation": string;
  'Notes': string;
}

export const RoadmapViewer: React.FC = () => {
  const [roadmap, setRoadmap] = useState<RoadmapItem[]>([]);
  const [filtered, setFiltered] = useState<RoadmapItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDomain, setSelectedDomain] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Fetch roadmap data
  useEffect(() => {
    fetchRoadmap();
  }, []);

  // Apply filters
  useEffect(() => {
    applyFilters();
  }, [roadmap, searchQuery, selectedDomain, selectedPriority, selectedStatus]);

  const fetchRoadmap = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:4000/roadmap');
      if (!response.ok) throw new Error('Erreur lors de le chargement de la roadmap');
      const data = await response.json();
      setRoadmap(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      setRoadmap([]);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let result = roadmap;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(item =>
        item.ID?.toLowerCase().includes(q) ||
        item['Fonctionnalité']?.toLowerCase().includes(q) ||
        item['Description']?.toLowerCase().includes(q)
      );
    }

    if (selectedDomain) {
      result = result.filter(item => item['Domaine'] === selectedDomain);
    }

    if (selectedPriority) {
      result = result.filter(item => item['Priorité'] === selectedPriority);
    }

    if (selectedStatus) {
      result = result.filter(item => item['Statut'] === selectedStatus);
    }

    setFiltered(result);
  };

  const getUniqueDomains = () => {
    const domains = new Set<string>();
    roadmap.forEach(item => {
      if (item['Domaine']) domains.add(item['Domaine']);
    });
    return Array.from(domains).sort();
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'P0': return '#FF0000';
      case 'P1': return '#FFA500';
      case 'P2': return '#FFFF00';
      case 'P3': return '#90EE90';
      default: return '#CCCCCC';
    }
  };

  const getStatusColor = (status: string) => {
    return status === 'Complété' ? '#90EE90' : '#FFB6C1';
  };

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>⏳ Chargement de la roadmap...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px', color: '#FF0000' }}>
        <h2>❌ Erreur</h2>
        <p>{error}</p>
        <button onClick={fetchRoadmap} style={{ padding: '8px 16px', cursor: 'pointer' }}>
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>📊 Roadmap Rubis</h1>
      <p style={{ color: '#666' }}>
        Total: <strong>{roadmap.length}</strong> spécifications | Affichées: <strong>{filtered.length}</strong>
      </p>

      {/* Filters Section */}
      <div style={{
        backgroundColor: '#F5F5F5',
        padding: '15px',
        borderRadius: '8px',
        marginBottom: '20px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '10px'
      }}>
        <input
          type="text"
          placeholder="🔍 Rechercher (ID, fonctionnalité, description)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ padding: '8px', borderRadius: '4px', border: '1px solid #CCC' }}
        />

        <select
          value={selectedDomain}
          onChange={(e) => setSelectedDomain(e.target.value)}
          style={{ padding: '8px', borderRadius: '4px', border: '1px solid #CCC' }}
        >
          <option value="">Tous les domaines</option>
          {getUniqueDomains().map((domain) => (
            <option key={domain} value={domain}>
              {domain}
            </option>
          ))}
        </select>

        <select
          value={selectedPriority}
          onChange={(e) => setSelectedPriority(e.target.value)}
          style={{ padding: '8px', borderRadius: '4px', border: '1px solid #CCC' }}
        >
          <option value="">Toutes priorités</option>
          {['P0', 'P1', 'P2', 'P3'].map((p) => (
            <option key={p} value={p}>
              Priorité {p}
            </option>
          ))}
        </select>

        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          style={{ padding: '8px', borderRadius: '4px', border: '1px solid #CCC' }}
        >
          <option value="">Tous statuts</option>
          <option value="Complété">Complété</option>
          <option value="Planifié">Planifié</option>
        </select>

        <button
          onClick={() => {
            setSearchQuery('');
            setSelectedDomain('');
            setSelectedPriority('');
            setSelectedStatus('');
          }}
          style={{
            padding: '8px 16px',
            backgroundColor: '#007BFF',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          🔄 Réinitialiser
        </button>
      </div>

      {/* Roadmap Items */}
      <div style={{ display: 'grid', gap: '12px' }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#999', padding: '20px' }}>
            <p>Aucune spécification ne correspond aux critères de filtrage.</p>
          </div>
        ) : (
          filtered.map((item) => (
            <div
              key={item.ID}
              style={{
                border: '1px solid #DDD',
                borderRadius: '8px',
                padding: '12px',
                backgroundColor: '#FFF',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onClick={() => setExpandedId(expandedId === item.ID ? null : item.ID)}
            >
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    backgroundColor: getPriorityColor(item['Priorité']),
                    color: item['Priorité'] === 'P2' ? '#000' : '#FFF',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontWeight: 'bold',
                    fontSize: '12px',
                    minWidth: '50px',
                    textAlign: 'center'
                  }}
                >
                  {item['Priorité']}
                </div>
                <div
                  style={{
                    backgroundColor: getStatusColor(item['Statut']),
                    color: '#000',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    minWidth: '80px',
                    textAlign: 'center'
                  }}
                >
                  {item['Statut']}
                </div>
                <strong style={{ fontSize: '14px' }}>{item.ID}</strong>
                <strong style={{ fontSize: '14px', color: '#333' }}>
                  {item['Fonctionnalité']}
                </strong>
                <span style={{ marginLeft: 'auto', color: '#999' }}>
                  {expandedId === item.ID ? '▼' : '▶'}
                </span>
              </div>

              {/* Meta */}
              <div style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
                <span style={{ marginRight: '15px' }}>📁 {item['Domaine']}</span>
                {item['Prédécesseurs'] !== '-' && (
                  <span>🔗 Dépend de: {item['Prédécesseurs']}</span>
                )}
              </div>

              {/* Expanded Details */}
              {expandedId === item.ID && (
                <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #EEE' }}>
                  <div style={{ marginBottom: '8px' }}>
                    <strong>Description:</strong>
                    <p style={{ margin: '4px 0', color: '#555' }}>
                      {item['Description']}
                    </p>
                  </div>

                  <div style={{ marginBottom: '8px' }}>
                    <strong>Directives d'implémentation:</strong>
                    <p style={{ margin: '4px 0', color: '#555', fontSize: '12px' }}>
                      {item["Directives d'implémentation"]}
                    </p>
                  </div>

                  {item['Notes'] && (
                    <div style={{ marginBottom: '8px' }}>
                      <strong>Notes:</strong>
                      <p style={{ margin: '4px 0', color: '#555', fontSize: '12px' }}>
                        {item['Notes']}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Stats Footer */}
      <div style={{ marginTop: '30px', padding: '15px', backgroundColor: '#F5F5F5', borderRadius: '8px' }}>
        <h3>📈 Statistiques</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px' }}>
          {['P0', 'P1', 'P2', 'P3'].map((p) => (
            <div key={p}>
              <strong>Priorité {p}:</strong>
              <span style={{ marginLeft: '8px', color: getPriorityColor(p) }}>
                {roadmap.filter(item => item['Priorité'] === p).length}
              </span>
            </div>
          ))}
        </div>
        <div style={{ marginTop: '10px' }}>
          <strong>Complété:</strong>
          <span style={{ marginLeft: '8px', color: '#90EE90' }}>
            {roadmap.filter(item => item['Statut'] === 'Complété').length}
          </span>
          <strong style={{ marginLeft: '20px' }}>Planifié:</strong>
          <span style={{ marginLeft: '8px', color: '#FFB6C1' }}>
            {roadmap.filter(item => item['Statut'] === 'Planifié').length}
          </span>
        </div>
      </div>
    </div>
  );
};
