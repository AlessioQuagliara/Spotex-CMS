import React from 'react';
import { useBuilderStore } from '../../store/builderStore';

export default function SettingsPanel() {
    const { selectedId } = useBuilderStore();

    if (!selectedId) {
        return (
            <aside className="w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col p-4">
                <div className="text-center text-gray-500 text-sm py-10">
                    Seleziona un elemento per modificarlo
                </div>
            </aside>
        );
    }

    return (
        <aside className="w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold text-sm">Proprietà</h3>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
                <div className="text-sm text-gray-500">Settings Panel - In sviluppo</div>
            </div>
        </aside>
    );
}
