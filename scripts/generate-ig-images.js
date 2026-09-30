const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function generateImages() {
  // 從環境變數攞新聞數據（由 GitHub Actions 傳入）
  const newsData = JSON.parse(process.env.NEWS_DATA || '[]');
  const label = process.env.IG_LABEL || 'MARKET UPDATE';
  const date = process.env.IG_DATE || new Date().toISOString().split('T')[0];
  
  // 建立輸出資料夾
  const outputDir = path.join(__dirname, '..', 'ig-output');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // 讀取 HTML 模板
  const template = fs.readFileSync(
    path.join(__dirname, '..', 'ig-template.html'),
    'utf-8'
  );
  
  // 啟動 Puppeteer
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1080, height: 1350 });
  
  // 為每則新聞生成一張圖
  for (let i = 0; i < newsData.length && i < 5; i++) {
    const news = newsData[i];
    
    // 替換模板佔位符
    let html = template
      .replace('{{LABEL}}', label)
      .replace('{{TITLE}}', news.title || '')
      .replace('{{HIGHLIGHT}}', news.highlight ? `<div class="highlight">${news.highlight}</div>` : '')
      .replace('{{CONTENT}}', news.content || '')
      .replace('{{SOURCE}}', news.source || 'AI 日報')
      .replace('{{DATE}}', date);
    
    await page.setContent(html, { waitUntil: 'networkidle0' });
    await page.screenshot({
      path: path.join(outputDir, `card-${i + 1}.png`),
      type: 'png'
    });
    
    console.log(`✅ 生成 card-${i + 1}.png`);
  }
  
  await browser.close();
  console.log('✅ 所有圖片生成完成');
}

generateImages().catch(err => {
  console.error('❌ 錯誤：', err);
  process.exit(1);
});
