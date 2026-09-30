const fs = require('fs');

const configContent = `// Auto-generated during Vercel deployment build step
window.ENV = {
    EMAILJS_PUBLIC_KEY: "${process.env.EMAILJS_PUBLIC_KEY || ''}",
    EMAILJS_SERVICE_ID: "${process.env.EMAILJS_SERVICE_ID || ''}",
    EMAILJS_ADMIN_TEMPLATE_ID: "${process.env.EMAILJS_ADMIN_TEMPLATE_ID || ''}",
    EMAILJS_CUSTOMER_TEMPLATE_ID: "${process.env.EMAILJS_CUSTOMER_TEMPLATE_ID || ''}"
};
`;

// Write directly into the js folder
fs.writeFileSync('js/config.js', configContent);
console.log('js/config.js successfully generated from Vercel environment variables.');