const { z } = require('zod');

const schema = z.object({
  qty: z.string().optional().nullable().or(z.literal('')),
});

try {
  console.log('Parsing null...', schema.parse({ qty: null }));
  console.log('Parsing undefined...', schema.parse({}));
  console.log('Parsing empty string...', schema.parse({ qty: '' }));
  console.log('Parsing string...', schema.parse({ qty: '123' }));
  console.log('Success!');
} catch (e) {
  console.error('Error:', e);
}
