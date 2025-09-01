import React, { useState } from 'react';
import TotalCollection from './TotalCollection';
import DailyCollection from './DailyCollection';
import UpdateCollection from './UpdateCollection';
import MarkDefault from './MarkDefault';
import UpdateInstallment from './UpdateInstallment';

export default function CollectionMain() {
  const [activeTab, setActiveTab] = useState('total');

  const tabs = [
    { id: 'total', label: 'Total Collection', component: TotalCollection },
    { id: 'daily', label: 'Daily Collection', component: DailyCollection },
    { id: 'update', label: 'Update Collection', component: UpdateCollection },
    { id: 'update-installment', label: 'Update Installment', component: UpdateInstallment },
    { id: 'default', label: 'Mark Default', component: MarkDefault }
  ];

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component || TotalCollection;

  return (
    <div>
      <div className="page-header">
        <h2>Collection Management</h2>
      </div>

      <div className="tab-navigation">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="tab-content">
        <ActiveComponent />
      </div>
    </div>
  );
}
