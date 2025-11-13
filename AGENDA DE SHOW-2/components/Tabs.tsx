

import React from 'react';

interface TabsProps {
    activeTab: string;
    setActiveTab: (tab: string) => void;
}

const TABS = [
    { id: 'addShow', label: 'Adicionar' },
    { id: 'showList', label: 'Shows' },
    { id: 'calendar', label: 'Agenda' },
    { id: 'share', label: 'Compart.' },
];

const Tabs: React.FC<TabsProps> = ({ activeTab, setActiveTab }) => {
    return (
        <nav className="flex justify-center border-b border-gray-700 mb-8 overflow-x-auto">
            {TABS.map(tab => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`p-4 font-semibold flex-shrink-0 transition-colors duration-200 ${
                        activeTab === tab.id
                            ? 'border-b-2 border-purple-500 text-purple-400'
                            : 'text-gray-400 hover:text-white'
                    }`}
                >
                    {tab.label}
                </button>
            ))}
        </nav>
    );
};

export default Tabs;