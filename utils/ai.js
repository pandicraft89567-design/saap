const OpenAI = require('openai');

const openai = new OpenAI({
    apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
    baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL
});

async function generateAIMessage(prompt, maxTokens = 100) {
    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [{ role: 'user', content: prompt }],
            max_tokens: maxTokens,
        });
        return response.choices[0].message.content.trim();
    } catch {
        return null;
    }
}

module.exports = { openai, generateAIMessage };
