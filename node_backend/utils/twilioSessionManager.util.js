const callSessions = new Map();

export function initSession(callSid) {
    callSessions.set(callSid, {
        lang: null,
        name: null,
        pincode: null,
        cropSuggestion: null,
        selectedCrop: null,
        landArea: null,
    });
}

export function getSession(callSid) {
    return callSessions.get(callSid);
}

export function updateSession(callSid, updates) {
    if (callSessions.has(callSid)) {
        const current = callSessions.get(callSid);
        callSessions.set(callSid, { ...current, ...updates });
    }
}

export function clearSession(callSid) {
    callSessions.delete(callSid);
}