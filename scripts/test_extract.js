// Script de test pour extractTextFromResponse
// Usage: node scripts/test_extract.js

const sample = {
  sdkHttpResponse: {
    headers: {
      'content-type': 'application/json; charset=UTF-8'
    }
  },
  candidates: [
    { content: { role: 'model' }, finishReason: 'MAX_TOKENS', index: 0 }
  ],
  modelVersion: 'gemini-2.5-flash',
  responseId: 'U_olacD_NoGA7M8P8JLH4A0',
  usageMetadata: { promptTokenCount: 215, totalTokenCount: 726 }
};

// Import the extract function from the route file by requiring it via ts-node is not trivial here,
// so replicate the minimal extraction logic similar to route's function for unit test.

function extractTextFromResponse(response) {
  if (!response) return { text: '', truncated: false };
  if (typeof response === 'string') return { text: response, truncated: false };
  if (response.text && typeof response.text === 'string') {
    return { text: response.text, truncated: response.finishReason === 'MAX_TOKENS' || false };
  }

  const outputResult = extractFromOutput(response);
  if (outputResult) return outputResult;

  const candidateResult = extractFromCandidates(response);
  if (candidateResult) return candidateResult;

  return { text: getFallback(response), truncated: response.finishReason === 'MAX_TOKENS' };
}

function extractFromContent(content) {
  if (!content) return null;
  if (typeof content === 'string') return content;
  if (typeof content.text === 'string' && content.text.trim().length) return content.text;
  
  if (Array.isArray(content.parts) && content.parts.length) return content.parts.join('');
  
  if (Array.isArray(content)) return extractFromArray(content);
  
  // Recursively check nested content (legacy/google format sometimes)
  if (content.content) return extractFromContent(content.content);
  
  return null;
}

function extractFromArray(arr) {
  if (!arr.length) return null;
  const first = arr[0];
  return extractFromContent(first);
}

function extractFromOutput(response) {
  if (response.output && Array.isArray(response.output) && response.output[0]) {
    const first = response.output[0];
    const t = extractFromContent(first);
    if (t) {
      return { 
        text: t, 
        truncated: response.finishReason === 'MAX_TOKENS' || first.finishReason === 'MAX_TOKENS' || false 
      };
    }
  }
  return null;
}

function extractFromCandidates(response) {
  if (!response.candidates || !Array.isArray(response.candidates) || !response.candidates.length) return null;

  let truncated = response.finishReason === 'MAX_TOKENS';
  for (const c of response.candidates) {
    if (c && c.finishReason === 'MAX_TOKENS') truncated = true;
    
    let text = null;
    if (typeof c.output === 'string' && c.output.trim().length) {
      text = c.output;
    } else {
      text = extractFromContent(c.content) || extractFromContent(c);
    }

    if (text) return { text, truncated };
  }
  return null;
}

function getFallback(response) {
  try {
    if (response.candidates) return JSON.stringify(response.candidates);
    if (response.output) return JSON.stringify(response.output);
    return JSON.stringify(response);
  } catch (e) { 
    return ''; 
  }
}

console.log('--- Test extractTextFromResponse ---');
const res = extractTextFromResponse(sample);
console.log('Extracted text (length):', res.text.length);
console.log('Extracted text (snippet):', res.text.slice(0, 200));
console.log('Truncated:', res.truncated);
console.log('--- End ---');
