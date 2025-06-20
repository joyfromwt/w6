import OpenAI from 'openai';

const apiKey = process.env.OPENAI_API_KEY;
// WARNING: For debugging only. This will expose your API key in the server logs.
console.log(`[/api/gpt] Full API Key being used: ${apiKey}`);
console.log(`[/api/gpt] Initializing... API Key loaded: ${!!apiKey}`);

const openai = new OpenAI({
  apiKey: apiKey,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Only POST requests allowed' });
  }

  const { words } = req.body;
  console.log('[/api/gpt] Received words:', words);

  if (!words || !Array.isArray(words) || words.length === 0) {
    return res.status(400).json({ message: 'Please provide an array of words.' });
  }
  
  const firstWord = words[0];
  const keywords = words.slice(1).join(', ');

  const prompt = `You are a curator at an exhibition titled "Artifacts of the Future."
The main exhibit is '${firstWord}', and the related keywords are '${keywords}'.
Write a poetic and insightful curation note in English.
Maintain a tone as if you are explaining an artifact from the 21st century to an audience in the future.
Follow this structure and tone: "Ladies and gentlemen, what you see here, the '${firstWord}', is a symbolic relic from the early 21st century, a turbulent era when humanity began to blur the lines between the digital and the real. People of that time imbued everyday objects like '${keywords}' with special meaning, using them to express their identities. This small artifact encapsulates their hopes, anxieties, and their vision of the future."
The entire text must be a single paragraph in English.
Do not use markdown or other formatting.`;
  console.log('[/api/gpt] Generated Prompt:', prompt);

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 250,
      temperature: 0.7,
    });

    const text = response.choices[0].message.content.trim();
    console.log('[/api/gpt] OpenAI Response Text:', text);
    res.status(200).json({ text });
  } catch (error) {
    console.error('[/api/gpt] Error fetching from OpenAI:', error);
    res.status(500).json({ message: 'Failed to fetch text from OpenAI' });
  }
}
