const OpenAI = require('openai');

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
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
