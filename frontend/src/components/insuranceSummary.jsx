import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI("AIzaSyCeynb813loy6F7AUHN9Ioe7t8o_miQ5wA"); // Vite env key

export const summarizeTxtFile = async (file) => {
  const readTextFromFile = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        const result = reader.result;
        if (typeof result !== 'string' || result.trim() === '') {
          reject(new Error('Uploaded file is empty or invalid.'));
        } else {
          resolve(result);
        }
      };

      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  const getGeminiSummary = async (text) => {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' }); // or gemini-pro/gemini-1.5-pro
    const prompt = `Please analyze this insurance policy document and provide a brief summary within one lines each in Hindi language. Focus on:

        1. **Policy Coverage**: What is covered and what is excluded
        2. **Key Terms**: Important conditions, deductibles, and limits
        3. **Claims Process**: How to file a claim and required documentation
        4. **Important Dates**: Policy period, renewal dates, and deadlines
        5. **Contact Information**: How to reach the insurance provider

Please format the response in a clear, easy-to-read manner with bullet points where appropriate.

Document content:
${text.slice(0, 5000)}`;

    const result = await model.generateContent(prompt);
    const response = result.response;

    return response.text() || 'No summary available';
  };

  try {
    const text = await readTextFromFile(file);
    const summary = await getGeminiSummary(text);
    return summary;
  } catch (err) {
    console.error('Error summarizing file:', err);
    return 'Failed to summarize the text file.';
  }
};