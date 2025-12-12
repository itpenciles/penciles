import React, { useState } from 'react';
import { Property, DealStage } from '../types';
import { useNavigate } from 'react-router-dom';

interface KanbanBoardProps {
    properties: Property[];
    onUpdateStatus: (property: Property, newStatus: DealStage) => Promise<void>;
}

const STAGES: DealStage[] = ['Lead', 'Analyzing', 'Offer Sent', 'Under Contract', 'Closed', 'Archived'];

const KanbanBoard: React.FC<KanbanBoardProps> = ({ properties, onUpdateStatus }) => {
    const navigate = useNavigate();
    const [draggedId, setDraggedId] = useState<string | null>(null);
    const [isUpdating, setIsUpdating] = useState(false);

    // Group properties by status
    const columns = STAGES.reduce((acc, stage) => {
        acc[stage] = properties.filter(p => (p.status || 'Lead') === stage);
        return acc;
    }, {} as Record<DealStage, Property[]>);

    const handleDragStart = (e: React.DragEvent, id: string) => {
        setDraggedId(id);
        e.dataTransfer.effectAllowed = 'move';
        // Hide ghost image if desired, or let browser handle it
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault(); // Necessary to allow dropping
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = async (e: React.DragEvent, stage: DealStage) => {
        e.preventDefault();
        if (!draggedId) return;

        const property = properties.find(p => p.id === draggedId);
        if (property && property.status !== stage) {
            setIsUpdating(true);
            try {
                await onUpdateStatus(property, stage);
            } catch (err) {
                console.error("Failed to update status", err);
                alert("Failed to move card.");
            } finally {
                setIsUpdating(false);
                setDraggedId(null);
            }
        }
    };

    const getStageColor = (stage: DealStage) => {
        switch (stage) {
            case 'Lead': return 'bg-blue-50 border-blue-200';
            case 'Analyzing': return 'bg-yellow-50 border-yellow-200';
            case 'Offer Sent': return 'bg-purple-50 border-purple-200';
            case 'Under Contract': return 'bg-orange-50 border-orange-200';
            case 'Closed': return 'bg-green-50 border-green-200';
            case 'Archived': return 'bg-gray-50 border-gray-200';
            default: return 'bg-gray-50 border-gray-200';
        }
    };

    return (
        <div className="flex gap-4 overflow-x-auto pb-8 min-h-[600px]">
            {STAGES.map(stage => (
                <div
                    key={stage}
                    className={`flex-shrink-0 w-72 rounded-xl flex flex-col ${getStageColor(stage)} border`}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, stage)}
                >
                    {/* Column Header */}
                    <div className="p-3 border-b border-gray-200/50 flex justify-between items-center">
                        <h3 className="font-bold text-gray-700 text-sm">{stage}</h3>
                        <span className="bg-white/50 text-gray-600 text-xs px-2 py-0.5 rounded-full font-medium">
                            {columns[stage].length}
                        </span>
                    </div>

                    {/* Cards Container */}
                    <div className="p-2 flex-grow overflow-y-auto space-y-2">
                        {columns[stage].map(property => (
                            <div
                                key={property.id}
                                draggable
                                onDragStart={(e) => handleDragStart(e, property.id)}
                                onClick={() => navigate(`/property/${property.id}`)}
                                className={`bg-white p-3 rounded-lg shadow-sm border border-gray-200 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow group ${isUpdating && draggedId === property.id ? 'opacity-50' : ''
                                    }`}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <div className="text-xs font-semibold text-gray-500 truncate w-full" title={property.propertyType}>
                                        {property.propertyType}
                                    </div>
                                    <div className={`w-2 h-2 rounded-full ${property.recommendation.level === 'Worth Pursuing' ? 'bg-green-500' :
                                            property.recommendation.level === 'Avoid' ? 'bg-red-500' : 'bg-yellow-500'
                                        }`}></div>
                                </div>

                                <h4 className="font-bold text-gray-800 text-sm leading-tight mb-1 truncate" title={property.address}>
                                    {property.address.split(',')[0]}
                                </h4>
                                <p className="text-xs text-gray-500 mb-2 truncate">
                                    {property.address.split(',').slice(1).join(',')}
                                </p>

                                <div className="flex justify-between items-center text-xs mt-2 pt-2 border-t border-gray-100">
                                    <span className="font-medium text-gray-700">
                                        ${property.financials.listPrice.toLocaleString()}
                                    </span>
                                    {property.calculations?.capRate > 0 && (
                                        <span className="text-green-600 font-bold bg-green-50 px-1.5 py-0.5 rounded">
                                            {property.calculations.capRate.toFixed(1)}% Cap
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default KanbanBoard;
