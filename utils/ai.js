const OpenAI = require('openai');

const openai = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: 'https://api.groq.com/openai/v1'
});

async function generateAIMessage(prompt, maxTokens = 100) {
    try {
        const response = await openai.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages: [{ role: 'user', content: prompt }],
            max_tokens: maxTokens,
        });
        return response.choices[0].message.content.trim();
    } catch {
        return null;
    }
}

module.exports = { openai, generateAIMessage };
