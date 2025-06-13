import OpenAI from 'openai';

const apiKey = process.env.OPENAI_API_KEY;
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

  const prompt = `당신은 "미래의 유물"이라는 전시회의 큐레이터입니다.
주요 전시품은 '${firstWord}'이고, 연관 키워드는 '${keywords}'입니다.
이것들을 활용하여 시적이고 이해하기 쉬운 한국어 해설을 작성해주세요.
마치 21세기의 유물을 미래의 관객에게 설명하는 듯한 톤을 유지해야 합니다.
다음의 구조와 톤을 따라주세요: "여러분, 보시는 이 '${firstWord}'은(는) [21세기 초반의 시대적 의미에 대한 설명]. 당시 사람들은 '${keywords}' 같은 [그것을 어떻게 사용했는지에 대한 묘사]. [이 유물이 무엇을 상징하는지에 대한 결론 문장]."
전체 텍스트는 한 문단의 한국어 문장이어야 합니다.
마크다운이나 다른 서식을 사용하지 마세요.`;
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
