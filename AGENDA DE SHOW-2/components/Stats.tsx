import React from 'react';
import { Show } from '../types';
import { formatCurrency } from '../utils/helpers';

interface StatsProps {
    shows: Show[];
}

const StatCard: React.FC<{ title: string; value: string | number }> = ({ title, value }) => (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
        <p className="text-sm text-gray-400">{title}</p>
        <p className="text-2xl font-bold">{value}</p>
    </div>
);

const Stats: React.FC<StatsProps> = ({ shows }) => {
    const totalShows = shows.length;
    const totalRevenue = shows.reduce((sum, s) => sum + s.fee, 0);
    const advancePaid = shows.reduce((sum, s) => sum + s.advance, 0);
    const balance = totalRevenue - advancePaid;

    return (
        <section className="grid grid-cols-2 gap-4 mb-8 text-center">
            <StatCard title="Total de Shows" value={totalShows} />
            <StatCard title="Receita Total" value={formatCurrency(totalRevenue)} />
            <StatCard title="Cachê Adiantado" value={formatCurrency(advancePaid)} />
            <StatCard title="Saldo a Receber" value={formatCurrency(balance)} />
        </section>
    );
};

export default Stats;