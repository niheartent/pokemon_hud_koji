const fs=require('node:fs');
const runtime=require('playwright');
module.exports={...runtime,launchOptions:process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:fs.existsSync('C:/Program Files/Google/Chrome/Application/chrome.exe')?{executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'}:{}};
