#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Функция для очистки console.log из файла
function cleanConsoleLogs(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;
    
    // Удаляем console.log строки, но оставляем console.error и console.warn
    // Также оставляем закомментированные console.log
    content = content.replace(/^\s*console\.log\([^)]*\);\s*$/gm, '');
    content = content.replace(/^\s*console\.log\([^)]*\);\s*$/g, '');
    
    // Удаляем многострочные console.log
    content = content.replace(/^\s*console\.log\(\s*\{[\s\S]*?\}\s*\);\s*$/gm, '');
    
    // Удаляем console.log внутри if блоков
    content = content.replace(/if\s*\([^)]*\)\s*\{\s*console\.log\([^)]*\);\s*\}/g, 'if ($1) {}');
    
    // Очищаем пустые строки
    content = content.replace(/\n\s*\n\s*\n/g, '\n\n');
    
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
    return false;
  }
}

// Функция для рекурсивного поиска файлов
function findFiles(dir, extensions) {
  let files = [];
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && !item.includes('node_modules') && !item.includes('.git')) {
      files = files.concat(findFiles(fullPath, extensions));
    } else if (stat.isFile() && extensions.some(ext => item.endsWith(ext))) {
      files.push(fullPath);
    }
  }
  
  return files;
}

// Основная функция
function main() {
  console.log('🧹 Очистка console.log из проекта...');
  
  const srcDir = path.join(__dirname, 'src');
  const backendDir = path.join(__dirname, 'backend');
  
  const extensions = ['.js', '.jsx'];
  let cleanedCount = 0;
  
  // Очищаем frontend
  if (fs.existsSync(srcDir)) {
    const frontendFiles = findFiles(srcDir, extensions);
    console.log(`📁 Найдено ${frontendFiles.length} frontend файлов`);
    
    for (const file of frontendFiles) {
      if (cleanConsoleLogs(file)) {
        console.log(`✅ Очищен: ${path.relative(__dirname, file)}`);
        cleanedCount++;
      }
    }
  }
  
  // Очищаем backend
  if (fs.existsSync(backendDir)) {
    const backendFiles = findFiles(backendDir, extensions);
    console.log(`📁 Найдено ${backendFiles.length} backend файлов`);
    
    for (const file of backendFiles) {
      if (cleanConsoleLogs(file)) {
        console.log(`✅ Очищен: ${path.relative(__dirname, file)}`);
        cleanedCount++;
      }
    }
  }
  
  console.log(`\n🎉 Очистка завершена! Обработано файлов: ${cleanedCount}`);
  
  // Показываем статистику
  const remainingLogs = findFiles(__dirname, extensions)
    .map(file => {
      const content = fs.readFileSync(file, 'utf8');
      const logMatches = (content.match(/console\.log\(/g) || []).length;
      const errorMatches = (content.match(/console\.error\(/g) || []).length;
      const warnMatches = (content.match(/console\.warn\(/g) || []).length;
      return { file, logs: logMatches, errors: errorMatches, warns: warnMatches };
    })
    .filter(item => item.logs > 0 || item.errors > 0 || item.warns > 0);
  
  if (remainingLogs.length > 0) {
    console.log('\n📊 Оставшиеся console вызовы:');
    remainingLogs.forEach(item => {
      console.log(`  ${path.relative(__dirname, item.file)}: ${item.logs} log, ${item.errors} error, ${item.warns} warn`);
    });
  }
}

main();
