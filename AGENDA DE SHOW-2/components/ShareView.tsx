
import React, { useState, useMemo } from 'react';
import { Show, ArtistInfo } from '../types';

interface ShareViewProps {
    shows: Show[];
    artistInfo: ArtistInfo;
}

const ShareView: React.FC<ShareViewProps> = ({ shows, artistInfo }) => {
    const [copySuccess, setCopySuccess] = useState('');

    const shareableContent = useMemo(() => {
        const allShows = [...shows].sort((a, b) => {
            const dateA = new Date(`${a.date}T${a.startTime || '00:00'}`);
            const dateB = new Date(`${b.date}T${b.startTime || '00:00'}`);
            return dateA.getTime() - dateB.getTime();
        });

        let content = '';
        if (artistInfo.name) {
            content += `*${artistInfo.name.toUpperCase()}*\n`; // Artist name uppercase
            content += "___________________________\n"; // New separator for artist name
        }
        content += "\n*PRÓXIMOS SHOWS*:\n"; // Updated header with asterisk and colon, added leading newline

        if (allShows.length === 0) {
            content += "Nenhum show na agenda por enquanto.";
        } else {
            allShows.forEach(show => {
                const showDate = new Date(show.date + 'T00:00:00');
                // Use a more specific locale or options if needed for "Quarta-feira, 12 de novembro" format
                const formattedDate = showDate.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });

                let timeLine = '';
                // Ensure duration is also positive for meaningful end time, as endTime might be derived
                if (show.startTime && show.endTime && show.duration > 0) { 
                    timeLine = `*Das* ${show.startTime} *às* ${show.endTime}`; // Updated time format with asterisks
                } else if (show.startTime) {
                    timeLine = `*Das* ${show.startTime}`; // Fallback if only start time is available with asterisk
                }

                content += `${formattedDate}\n`; // Date first, no prefix
                content += `*${show.location.toUpperCase()}*\n`; // Location second, uppercase and with asterisks
                if (timeLine) { // Only add time line if it's not empty
                    content += `${timeLine}\n`;
                }
                content += "----------------------------\n"; // New separator (28 dashes)
            });
        }
        return content;
    }, [shows, artistInfo.name]); // Added artistInfo.name to dependency array

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text).then(() => {
            setCopySuccess('simple');
            setTimeout(() => setCopySuccess(''), 2000);
        });
    };

    return (
        <section className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-4 text-center">Compartilhar Agenda</h2>
            
            <h3 className="text-lg font-semibold mb-2">{artistInfo.name || 'Sua Agenda'}</h3>
            <div className="bg-gray-900 p-4 rounded-md whitespace-pre-wrap font-mono text-sm max-h-60 overflow-y-auto">
                {shareableContent}
            </div>
            
            <div className="text-center mt-6 flex flex-col md:flex-row gap-4 justify-center">
                <button onClick={() => handleCopy(shareableContent)} className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-md transition-colors">
                    {copySuccess === 'simple' ? 'Copiado!' : 'Copiar Lista Simples'}
                </button>
            </div>
        </section>
    );
};

export default ShareView;
