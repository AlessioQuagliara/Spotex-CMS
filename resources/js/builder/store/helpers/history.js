export const MAX_HISTORY = 20;

const trimHistory = (history, maxHistory = MAX_HISTORY) =>
    history.length > maxHistory ? history.slice(history.length - maxHistory) : history;

export const appendHistory = (
    history,
    historyIndex,
    snapshot,
    maxHistory = MAX_HISTORY
) => {
    const nextHistory = history.slice(0, historyIndex + 1);
    nextHistory.push(snapshot);

    const normalizedHistory = trimHistory(nextHistory, maxHistory);

    return {
        history: normalizedHistory,
        historyIndex: normalizedHistory.length - 1,
    };
};
