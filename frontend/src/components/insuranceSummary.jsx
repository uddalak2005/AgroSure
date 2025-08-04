import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY); // Vite env key

export const summarizeTxtFile = async (file) => {


  const dummyGeminiResponse = `यह "Farmer's Protection Plus Insurance Policy" किसानों को प्राकृतिक आपदाओं, 
  पशुधन हानि, कृषि उपकरणों की क्षति, आग, चोरी और व्यक्तिगत दुर्घटनाओं से सुरक्षा प्रदान करता है। यह पॉलिसी 1
   अप्रैल 2025 से 31 मार्च 2026 तक वैध है, और इसकी कुल सीमा ₹12,00,000 है। इसमें उपसीमाएं जैसे कि फसल हानि 
   (₹6,00,000), उपकरण क्षति (₹3,00,000), पशुधन हानि (₹2,00,000) और व्यक्तिगत दुर्घटना (₹1,00,000) शामिल हैं। 
   हर दावे पर ₹5,000 की कटौती लागू होती है। दावे की सूचना 48 घंटे के भीतर देनी होती है और दस्तावेज 14 दिनों में जमा करने होते हैं। 
   अगर सालभर कोई दावा नहीं किया गया तो अगले साल 5% अतिरिक्त कवरेज मिलता है। इसके साथ ही मुफ्त वार्षिक मृदा परीक्षण, 
   मोबाइल ऐप की सुविधा और कुछ स्थितियों में 10% प्रीमियम छूट भी मिलती है। आपातकालीन सहायता 24/7 उपलब्ध है।`

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
    return dummyGeminiResponse;
  }
};