const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function generateImages() {
  const newsData = JSON.parse(process.env.NEWS_DATA || '[]');
  const label = process.env.IG_LABEL || 'MARKET UPDATE';
  const date = process.env.IG_DATE || new Date().toISOString().split('T')[0];
  
  const outputDir = path.join(__dirname, '..', 'ig-output');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  const templatePath = path.join(__dirname, '..', 'ig-template.html');
  const template = fs.readFileSync(templatePath, 'utf-8');
  
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1080, height: 1350 });
  
  let html = template.replace('{{LABEL}}', label).replace('{{DATE}}', date);
  
  for (let i = 1; i <= 5; i++) {
    const item = newsData[i - 1] || {};
    html = html.replace(`{{POINT_${i}}}`, item.point || '暫無數據');
  }
  
  try {
    await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await new Promise(resolve => setTimeout(resolve, 500));
    
    await page.screenshot({ path: path.join(outputDir, 'summary.png'), type: 'png' });
    console.log(`✅ 生成 summary.png 成功`);
  } catch (err) {
    console.error('❌ 生成失敗：', err.message);
  }
  
  await browser.close();
}

generateImages().catch(err => {
  console.error('❌ 錯誤：', err);
  process.exit(1);
});
