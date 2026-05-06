import https from 'https';

const API_KEY = process.env.GOOGLE_API_KEY || 'AIzaSyB53wLja_tPFEwxe3dJVedtsPZWTqTtCss';

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
