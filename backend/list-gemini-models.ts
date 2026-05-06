import https from 'https';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const API_KEY = process.env.GOOGLE_API_KEY;

if (!API_KEY) {
  console.error('Error: GOOGLE_API_KEY environment variable is not set');
  console.error('Please create a .env file with your Google API key:');
  console.error('GOOGLE_API_KEY=your_actual_api_key_here');
  process.exit(1);
}

const options = {
  hostname: 'generativelanguage.googleapis.com',
  path: `/v1beta/models?key=${API_KEY}`,
  method: 'GET',
};

https.get(options, (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    try {
      const response = JSON.parse(data);
      console.log('\n=== Modelos Disponibles en Gemini ===\n');
      
      if (response.models) {
        response.models.forEach((model: any) => {
          console.log(`• ${model.name}`);
          console.log(`  Display Name: ${model.displayName}`);
          console.log(`  Description: ${model.description}`);
          console.log(`  Supported Generation Methods: ${model.supportedGenerationMethods?.join(', ')}`);
          console.log('');
        });
      } else {
        console.log('No se encontraron modelos o error en la respuesta:');
        console.log(JSON.stringify(response, null, 2));
      }
    } catch (error) {
      console.error('Error parsing response:', error);
      console.log('Raw response:', data);
    }
  });
}).on('error', (error) => {
  console.error('Error fetching models:', error);
});
