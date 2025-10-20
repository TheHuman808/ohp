// Код для Google Apps Script
// Скопируйте этот код в ваш Google Apps Script проект

function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  try {
    let result = { success: false, error: 'No action specified' };
    
    // Обработка POST запросов
    if (e.postData && e.postData.contents) {
      const data = JSON.parse(e.postData.contents);
      const action = data.action;
      
      switch (action) {
        case 'registerPartner':
          result = registerPartner(data.data);
          break;
        case 'testConnection':
          result = { success: true, message: 'Connection successful' };
          break;
        default:
          result = { success: false, error: 'Unknown action: ' + action };
      }
    } else {
      // Обработка GET запросов
      result = { success: true, message: 'Google Apps Script is working' };
    }
    
    // Создаем ответ с правильными CORS заголовками
    const output = ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
    
    return output;
      
  } catch (error) {
    const errorResult = {
      success: false,
      error: 'Server error: ' + error.toString()
    };
    
    const output = ContentService
      .createTextOutput(JSON.stringify(errorResult))
      .setMimeType(ContentService.MimeType.JSON);
    
    return output;
  }
}

function registerPartner(partnerData) {
  try {
    console.log('Registering partner:', partnerData);
    
    // Получаем активную таблицу
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const partnersSheet = spreadsheet.getSheetByName('Партнеры');
    
    if (!partnersSheet) {
      return { success: false, error: 'Лист "Партнеры" не найден' };
    }
    
    // Получаем все данные партнеров для проверки
    const lastRow = partnersSheet.getLastRow();
    let partnersData = [];
    
    if (lastRow > 1) {
      partnersData = partnersSheet.getRange(2, 1, lastRow - 1, 13).getValues();
    }
    
    // Проверяем, существует ли партнер с таким Telegram ID
    const existingPartner = partnersData.find(row => row[1] === partnerData.telegramId);
    if (existingPartner) {
      return { success: false, error: 'Партнер с таким Telegram ID уже существует' };
    }
    
    // Проверяем валидность промокода пригласившего
    let inviterTelegramId = '';
    const inviter = partnersData.find(row => row[7] === partnerData.inviterCode);
    
    if (!inviter) {
      return { success: false, error: 'Неверный промокод пригласившего' };
    }
    
    inviterTelegramId = inviter[1]; // Telegram ID пригласившего
    
    // Генерируем новый ID и промокод
    const newId = lastRow; // Новый ID равен номеру строки
    const promoCode = generatePromoCode();
    
    // Проверяем уникальность промокода
    const existingPromo = partnersData.find(row => row[7] === promoCode);
    if (existingPromo) {
      return { success: false, error: 'Ошибка генерации промокода' };
    }
    
    // Подготавливаем данные для записи
    const rowData = [
      newId,                           // A: ID
      partnerData.telegramId,          // B: Telegram ID
      partnerData.firstName,           // C: Имя  
      partnerData.lastName,            // D: Фамилия
      partnerData.phone,               // E: Телефон
      partnerData.email,               // F: Email
      partnerData.username || '',      // G: Username
      promoCode,                       // H: Промокод
      partnerData.inviterCode,         // I: Промокод пригласившего
      inviterTelegramId,               // J: Telegram ID пригласившего
      partnerData.registrationDate,    // K: Дата регистрации
      0,                               // L: Общий доход
      0                                // M: Количество продаж
    ];
    
    // Добавляем строку в таблицу
    partnersSheet.appendRow(rowData);
    
    console.log('Partner registered successfully:', {
      id: newId,
      telegramId: partnerData.telegramId,
      promoCode: promoCode
    });
    
    return {
      success: true,
      promoCode: promoCode,
      message: 'Партнер успешно зарегистрирован'
    };
    
  } catch (error) {
    console.error('Registration error:', error);
    return {
      success: false,
      error: 'Ошибка при регистрации: ' + error.toString()
    };
  }
}

function generatePromoCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'PARTNER';
  
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
}

// Функция для автоматического расчета комиссий при добавлении продажи
function onEdit(e) {
  try {
    const sheet = e.source.getActiveSheet();
    const range = e.range;
    
    // Проверяем, что изменения в листе "Продажи"
    if (sheet.getName() !== 'Продажи') {
      return;
    }
    
    // Проверяем, что редактировалась строка с данными (не заголовок)
    if (range.getRow() < 2) {
      return;
    }
    
    // Получаем данные измененной строки
    const rowData = sheet.getRange(range.getRow(), 1, 1, 4).getValues()[0];
    const [saleId, date, amount, promoCode] = rowData;
    
    // Если есть все необходимые данные, рассчитываем комиссии
    if (saleId && amount && promoCode) {
      calculateCommissions(saleId, amount, promoCode, date);
    }
    
  } catch (error) {
    console.error('onEdit error:', error);
  }
}

function calculateCommissions(saleId, amount, promoCode, saleDate) {
  try {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const partnersSheet = spreadsheet.getSheetByName('Партнеры');
    const commissionsSheet = spreadsheet.getSheetByName('Начисления');
    const settingsSheet = spreadsheet.getSheetByName('Настройки');
    
    if (!partnersSheet || !commissionsSheet || !settingsSheet) {
      console.error('Required sheets not found');
      return;
    }
    
    // Получаем настройки комиссий
    const settings = settingsSheet.getRange(2, 1, 4, 2).getValues();
    const commissionRates = {
      level1: settings[0][1] || 0.1,  // 10%
      level2: settings[1][1] || 0.05, // 5%
      level3: settings[2][1] || 0.03, // 3%
      level4: settings[3][1] || 0.02  // 2%
    };
    
    // Находим партнера по промокоду
    const partnersData = partnersSheet.getRange(2, 1, partnersSheet.getLastRow() - 1, 13).getValues();
    const partner = partnersData.find(row => row[7] === promoCode);
    
    if (!partner) {
      console.error('Partner not found for promo code:', promoCode);
      return;
    }
    
    // Рассчитываем комиссии по уровням
    const commissions = [];
    let currentPartner = partner;
    
    for (let level = 1; level <= 4; level++) {
      if (!currentPartner) break;
      
      const rate = commissionRates[`level${level}`];
      const commissionAmount = amount * rate;
      
      commissions.push([
        generateCommissionId(),      // ID начисления
        saleId,                      // ID продажи
        currentPartner[1],           // Telegram ID партнера
        level,                       // Уровень
        commissionAmount,            // Сумма комиссии
        rate,                        // Процент
        saleDate || new Date()       // Дата
      ]);
      
      // Находим пригласившего для следующего уровня
      const inviterTelegramId = currentPartner[9];
      if (inviterTelegramId) {
        currentPartner = partnersData.find(row => row[1] === inviterTelegramId);
      } else {
        break;
      }
    }
    
    // Записываем комиссии
    if (commissions.length > 0) {
      const lastRow = commissionsSheet.getLastRow();
      commissionsSheet.getRange(lastRow + 1, 1, commissions.length, 7).setValues(commissions);
      
      // Обновляем общие доходы партнеров
      updatePartnerEarnings(partnersData, commissions, partnersSheet);
    }
    
  } catch (error) {
    console.error('Commission calculation error:', error);
  }
}

function generateCommissionId() {
  return 'COM_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
}

function updatePartnerEarnings(partnersData, commissions, partnersSheet) {
  try {
    // Группируем комиссии по Telegram ID
    const earningsByPartner = {};
    
    commissions.forEach(commission => {
      const telegramId = commission[2];
      const amount = commission[4];
      
      if (!earningsByPartner[telegramId]) {
        earningsByPartner[telegramId] = 0;
      }
      earningsByPartner[telegramId] += amount;
    });
    
    // Обновляем данные в таблице
    Object.keys(earningsByPartner).forEach(telegramId => {
      const partnerRowIndex = partnersData.findIndex(row => row[1] === telegramId);
      
      if (partnerRowIndex !== -1) {
        const currentEarnings = partnersData[partnerRowIndex][11] || 0;
        const newEarnings = currentEarnings + earningsByPartner[telegramId];
        
        // Обновляем общий доход (колонка L, индекс 12)
        partnersSheet.getRange(partnerRowIndex + 2, 12).setValue(newEarnings);
        
        // Увеличиваем счетчик продаж (колонка M, индекс 13)
        const currentSales = partnersData[partnerRowIndex][12] || 0;
        partnersSheet.getRange(partnerRowIndex + 2, 13).setValue(currentSales + 1);
      }
    });
    
  } catch (error) {
    console.error('Update earnings error:', error);
  }
}
