

import React from 'react';
import { Layout } from './components/Layout';
import { Ingestion } from './components/Ingestion';
import { DataQuery } from './components/DataQuery';
import { Comparison } from './components/Comparison';
import { NormalizationMap } from './components/NormalizationMap';
import { AnalystChat } from './components/AnalystChat';
import { Settings } from './components/Settings';
import { DataValidation } from './components/DataValidation';
import { DataProvider, useData } from './contexts/DataContext';

const AppContent: React.FC = () => {
  const { activeTab, setActiveTab } = useData();

  const renderContent = () => {
    switch (activeTab) {
      case 'ingestion':
        return <Ingestion />;
      case 'validation':
        return <DataValidation />;
      case 'query':
        return <DataQuery />;
      case 'mapping':
        return <NormalizationMap />;
      case 'comparison':
        return <Comparison />;
      case 'analyst':
        return <AnalystChat />;
      case 'settings':
        return <Settings />;
      default:
        return <Comparison />;
    }
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      {renderContent()}
    </Layout>
  );
};

const App: React.FC = () => {
  return (
    <DataProvider>
      <AppContent />
    </DataProvider>
  );
};

export default App;