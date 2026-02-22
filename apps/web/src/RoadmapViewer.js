import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
export const RoadmapViewer = () => {
    const [roadmap, setRoadmap] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    // Filter states
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDomain, setSelectedDomain] = useState('');
    const [selectedPriority, setSelectedPriority] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('');
    const [expandedId, setExpandedId] = useState(null);
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
            if (!response.ok)
                throw new Error('Erreur lors de le chargement de la roadmap');
            const data = await response.json();
            setRoadmap(data);
            setError(null);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Erreur inconnue');
            setRoadmap([]);
        }
        finally {
            setLoading(false);
        }
    };
    const applyFilters = () => {
        let result = roadmap;
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            result = result.filter(item => item.ID?.toLowerCase().includes(q) ||
                item['Fonctionnalité']?.toLowerCase().includes(q) ||
                item['Description']?.toLowerCase().includes(q));
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
        const domains = new Set();
        roadmap.forEach(item => {
            if (item['Domaine'])
                domains.add(item['Domaine']);
        });
        return Array.from(domains).sort();
    };
    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'P0': return '#FF0000';
            case 'P1': return '#FFA500';
            case 'P2': return '#FFFF00';
            case 'P3': return '#90EE90';
            default: return '#CCCCCC';
        }
    };
    const getStatusColor = (status) => {
        return status === 'Complété' ? '#90EE90' : '#FFB6C1';
    };
    if (loading) {
        return (_jsx("div", { style: { padding: '20px', textAlign: 'center' }, children: _jsx("h2", { children: "\u23F3 Chargement de la roadmap..." }) }));
    }
    if (error) {
        return (_jsxs("div", { style: { padding: '20px', color: '#FF0000' }, children: [_jsx("h2", { children: "\u274C Erreur" }), _jsx("p", { children: error }), _jsx("button", { onClick: fetchRoadmap, style: { padding: '8px 16px', cursor: 'pointer' }, children: "R\u00E9essayer" })] }));
    }
    return (_jsxs("div", { style: { padding: '20px', fontFamily: 'Arial, sans-serif' }, children: [_jsx("h1", { children: "\uD83D\uDCCA Roadmap Rubis" }), _jsxs("p", { style: { color: '#666' }, children: ["Total: ", _jsx("strong", { children: roadmap.length }), " sp\u00E9cifications | Affich\u00E9es: ", _jsx("strong", { children: filtered.length })] }), _jsxs("div", { style: {
                    backgroundColor: '#F5F5F5',
                    padding: '15px',
                    borderRadius: '8px',
                    marginBottom: '20px',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '10px'
                }, children: [_jsx("input", { type: "text", placeholder: "\uD83D\uDD0D Rechercher (ID, fonctionnalit\u00E9, description)...", value: searchQuery, onChange: (e) => setSearchQuery(e.target.value), style: { padding: '8px', borderRadius: '4px', border: '1px solid #CCC' } }), _jsxs("select", { value: selectedDomain, onChange: (e) => setSelectedDomain(e.target.value), style: { padding: '8px', borderRadius: '4px', border: '1px solid #CCC' }, children: [_jsx("option", { value: "", children: "Tous les domaines" }), getUniqueDomains().map((domain) => (_jsx("option", { value: domain, children: domain }, domain)))] }), _jsxs("select", { value: selectedPriority, onChange: (e) => setSelectedPriority(e.target.value), style: { padding: '8px', borderRadius: '4px', border: '1px solid #CCC' }, children: [_jsx("option", { value: "", children: "Toutes priorit\u00E9s" }), ['P0', 'P1', 'P2', 'P3'].map((p) => (_jsxs("option", { value: p, children: ["Priorit\u00E9 ", p] }, p)))] }), _jsxs("select", { value: selectedStatus, onChange: (e) => setSelectedStatus(e.target.value), style: { padding: '8px', borderRadius: '4px', border: '1px solid #CCC' }, children: [_jsx("option", { value: "", children: "Tous statuts" }), _jsx("option", { value: "Compl\u00E9t\u00E9", children: "Compl\u00E9t\u00E9" }), _jsx("option", { value: "Planifi\u00E9", children: "Planifi\u00E9" })] }), _jsx("button", { onClick: () => {
                            setSearchQuery('');
                            setSelectedDomain('');
                            setSelectedPriority('');
                            setSelectedStatus('');
                        }, style: {
                            padding: '8px 16px',
                            backgroundColor: '#007BFF',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }, children: "\uD83D\uDD04 R\u00E9initialiser" })] }), _jsx("div", { style: { display: 'grid', gap: '12px' }, children: filtered.length === 0 ? (_jsx("div", { style: { textAlign: 'center', color: '#999', padding: '20px' }, children: _jsx("p", { children: "Aucune sp\u00E9cification ne correspond aux crit\u00E8res de filtrage." }) })) : (filtered.map((item) => (_jsxs("div", { style: {
                        border: '1px solid #DDD',
                        borderRadius: '8px',
                        padding: '12px',
                        backgroundColor: '#FFF',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease'
                    }, onClick: () => setExpandedId(expandedId === item.ID ? null : item.ID), children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '12px' }, children: [_jsx("div", { style: {
                                        backgroundColor: getPriorityColor(item['Priorité']),
                                        color: item['Priorité'] === 'P2' ? '#000' : '#FFF',
                                        padding: '4px 8px',
                                        borderRadius: '4px',
                                        fontWeight: 'bold',
                                        fontSize: '12px',
                                        minWidth: '50px',
                                        textAlign: 'center'
                                    }, children: item['Priorité'] }), _jsx("div", { style: {
                                        backgroundColor: getStatusColor(item['Statut']),
                                        color: '#000',
                                        padding: '4px 8px',
                                        borderRadius: '4px',
                                        fontSize: '12px',
                                        minWidth: '80px',
                                        textAlign: 'center'
                                    }, children: item['Statut'] }), _jsx("strong", { style: { fontSize: '14px' }, children: item.ID }), _jsx("strong", { style: { fontSize: '14px', color: '#333' }, children: item['Fonctionnalité'] }), _jsx("span", { style: { marginLeft: 'auto', color: '#999' }, children: expandedId === item.ID ? '▼' : '▶' })] }), _jsxs("div", { style: { marginTop: '8px', fontSize: '12px', color: '#666' }, children: [_jsxs("span", { style: { marginRight: '15px' }, children: ["\uD83D\uDCC1 ", item['Domaine']] }), item['Prédécesseurs'] !== '-' && (_jsxs("span", { children: ["\uD83D\uDD17 D\u00E9pend de: ", item['Prédécesseurs']] }))] }), expandedId === item.ID && (_jsxs("div", { style: { marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #EEE' }, children: [_jsxs("div", { style: { marginBottom: '8px' }, children: [_jsx("strong", { children: "Description:" }), _jsx("p", { style: { margin: '4px 0', color: '#555' }, children: item['Description'] })] }), _jsxs("div", { style: { marginBottom: '8px' }, children: [_jsx("strong", { children: "Directives d'impl\u00E9mentation:" }), _jsx("p", { style: { margin: '4px 0', color: '#555', fontSize: '12px' }, children: item["Directives d'implémentation"] })] }), item['Notes'] && (_jsxs("div", { style: { marginBottom: '8px' }, children: [_jsx("strong", { children: "Notes:" }), _jsx("p", { style: { margin: '4px 0', color: '#555', fontSize: '12px' }, children: item['Notes'] })] }))] }))] }, item.ID)))) }), _jsxs("div", { style: { marginTop: '30px', padding: '15px', backgroundColor: '#F5F5F5', borderRadius: '8px' }, children: [_jsx("h3", { children: "\uD83D\uDCC8 Statistiques" }), _jsx("div", { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px' }, children: ['P0', 'P1', 'P2', 'P3'].map((p) => (_jsxs("div", { children: [_jsxs("strong", { children: ["Priorit\u00E9 ", p, ":"] }), _jsx("span", { style: { marginLeft: '8px', color: getPriorityColor(p) }, children: roadmap.filter(item => item['Priorité'] === p).length })] }, p))) }), _jsxs("div", { style: { marginTop: '10px' }, children: [_jsx("strong", { children: "Compl\u00E9t\u00E9:" }), _jsx("span", { style: { marginLeft: '8px', color: '#90EE90' }, children: roadmap.filter(item => item['Statut'] === 'Complété').length }), _jsx("strong", { style: { marginLeft: '20px' }, children: "Planifi\u00E9:" }), _jsx("span", { style: { marginLeft: '8px', color: '#FFB6C1' }, children: roadmap.filter(item => item['Statut'] === 'Planifié').length })] })] })] }));
};
