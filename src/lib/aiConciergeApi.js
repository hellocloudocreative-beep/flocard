/* ==========================================================================
   FLOCARD AI CONCIERGE — CLIENT API SERVICE
   Communicates with the secure server-side endpoint (/api/ai-concierge).
   No API keys are exposed or handled on the client.
   ========================================================================== */

export async function checkAiConfigStatus() {
  try {
    const res = await fetch('/api/ai-concierge/status');
    if (!res.ok) {
      return { configured: false, error: 'Server status check failed' };
    }
    return await res.json();
  } catch (err) {
    return { configured: false, error: err.message };
  }
}

export async function sendAiConciergeMessage({
  message = '',
  action = 'chat',
  history = [],
  profileInputs = null,
  designContext = null
}) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

    const res = await fetch('/api/ai-concierge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        action,
        history,
        profileInputs,
        designContext
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return {
        success: false,
        configured: data.configured ?? true,
        error: data.error || `Server returned error (${res.status})`
      };
    }

    return {
      success: true,
      configured: data.configured !== false,
      provider: data.provider || 'AI Provider',
      text: data.text || '',
      suggestion: data.suggestion || null,
      error: data.error || null,
      setupInstructions: data.setupInstructions || null
    };
  } catch (err) {
    if (err.name === 'AbortError') {
      return {
        success: false,
        error: 'The AI Concierge request timed out. Please try again.'
      };
    }
    return {
      success: false,
      error: `Network error: ${err.message || 'Unable to connect to AI server'}`
    };
  }
}
