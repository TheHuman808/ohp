# Настройка Google Sheets для партнерской программы

## 1. Создание Google Таблицы

1. Откройте [Google Sheets](https://sheets.google.com)
2. Создайте новую таблицу
3. Переименуйте её в "Партнерская программа"

## 2. Создание листов

Создайте следующие листы:

### Лист "Партнеры"
Колонки (A-M):
- A: ID (уникальный идентификатор)
- B: Telegram ID
- C: Имя
- D: Фамилия
- E: Телефон
- F: Email
- G: Username
- H: Промокод (генерируется автоматически)
- I: Промокод пригласившего
- J: Telegram ID пригласившего
- K: Дата регистрации
- L: Общий доход
- M: Количество продаж

**Заголовки первой строки:**
ID | Telegram ID | Имя | Фамилия | Телефон | Email | Username | Промокод | Промокод пригласившего | Telegram ID пригласившего | Дата регистрации | Общий доход | Количество продаж

### Лист "Продажи"
Колонки (A-D):
- A: ID продажи
- B: Дата
- C: Сумма
- D: Промокод

**Заголовки первой строки:**
ID продажи | Дата | Сумма | Промокод

### Лист "Начисления"
Колонки (A-G):
- A: ID начисления
- B: ID продажи
- C: Telegram ID партнера
- D: Уровень
- E: Сумма начисления
- F: Процент
- G: Дата

**Заголовки первой строки:**
ID начисления | ID продажи | Telegram ID партнера | Уровень | Сумма начисления | Процент | Дата

### Лист "Настройки"
Колонки (A-B):
- A: Уровень
- B: Процент

**Заполните настройки:**
- Уровень 1: 8
- Уровень 2: 4
- Уровень 3: 2
- Уровень 4: 1

**Заголовки первой строки:**
Уровень | Процент

## 3. Работа с таблицей

### Для внесения данных о продажах:
1. Откройте лист "Продажи"
2. Добавьте новую строку со следующими данными:
   - **ID продажи**: любой уникальный идентификатор (например, SALE001)
   - **Дата**: дата продажи в формате ГГГГ-ММ-ДД
   - **Сумма**: сумма продажи в рублях
   - **Промокод**: промокод партнера, который привлек клиента

### Автоматические процессы:
- При добавлении новой продажи автоматически рассчитываются начисления для всех 4 уровней партнеров
- Данные появляются в листе "Начисления"
- Обновляется общий доход партнеров в листе "Партнеры"

### Для просмотра информации:
- **Лист "Партнеры"**: содержит всех зарегистрированных партнеров с полной информацией
- **Лист "Начисления"**: показывает все начисления по каждой продаже
- **Лист "Настройки"**: позволяет изменить проценты комиссий

## 4. Настройка Google Apps Script

1. В таблице перейдите в Extensions > Apps Script
2. Замените содержимое файла Code.gs на следующий код:

```javascript
function onEdit(e) {
  // Отслеживаем изменения в листе "Продажи"
  if (e.source.getActiveSheet().getName() === 'Продажи' && e.range.getRow() > 1) {
    calculateCommissions(e.range.getRow());
  }
}

function calculateCommissions(row) {
  const salesSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Продажи');
  const partnersSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Партнеры');
  const commissionsSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Начисления');
  const settingsSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Настройки');
  
  // Получаем данные о продаже
  const saleData = salesSheet.getRange(row, 1, 1, 4).getValues()[0];
  const [saleId, date, amount, promoCode] = saleData;
  
  if (!promoCode || !amount) return;
  
  // Получаем настройки комиссий
  const settingsData = settingsSheet.getRange(2, 1, 4, 2).getValues();
  const commissionRates = {};
  settingsData.forEach(([level, rate]) => {
    commissionRates[level] = rate / 100;
  });
  
  // Найдем партнера по промокоду
  const partnersData = partnersSheet.getRange(2, 1, partnersSheet.getLastRow() - 1, 7).getValues();
  let currentPartner = null;
  
  for (let partner of partnersData) {
    if (partner[4] === promoCode) { // Промокод в колонке E (индекс 4)
      currentPartner = partner;
      break;
    }
  }
  
  if (!currentPartner) return;
  
  // Рассчитываем комиссии для 4 уровней
  let level = 1;
  let partnerTelegramId = currentPartner[1]; // Telegram ID в колонке B (индекс 1)
  
  while (level <= 4 && partnerTelegramId) {
    const commission = amount * commissionRates[level];
    
    // Добавляем запись в начисления
    commissionsSheet.appendRow([
      `COMM_${Date.now()}_${level}`,
      saleId,
      partnerTelegramId,
      level,
      commission,
      commissionRates[level] * 100,
      new Date().toISOString().split('T')[0]
    ]);
    
    // Обновляем общий доход партнера
    updatePartnerEarnings(partnerTelegramId, commission);
    
    // Находим следующего партнера в цепочке
    let nextPartner = null;
    for (let partner of partnersData) {
      if (partner[1] === partnerTelegramId && partner[6]) { // Telegram ID пригласившего в колонке G (индекс 6)
        nextPartner = partnersData.find(p => p[1] === partner[6]);
        break;
      }
    }
    
    if (nextPartner) {
      partnerTelegramId = nextPartner[1];
      level++;
    } else {
      break;
    }
  }
}

function updatePartnerEarnings(telegramId, amount) {
  const partnersSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Партнеры');
  const data = partnersSheet.getRange(2, 1, partnersSheet.getLastRow() - 1, 9).getValues();
  
  for (let i = 0; i < data.length; i++) {
    if (data[i][1] === telegramId) { // Telegram ID в колонке B (индекс 1)
      const currentEarnings = data[i][8] || 0; // Общий доход в колонке I (индекс 8)
      partnersSheet.getRange(i + 2, 9).setValue(currentEarnings + amount);
      break;
    }
  }
}
```

3. Сохраните скрипт
4. Настройте триггер: Triggers > Add Trigger > выберите onEdit

## 5. Переменные окружения

Добавьте в переменные окружения:
- `GOOGLE_SHEETS_API_KEY` - ваш API ключ
- `GOOGLE_SHEETS_ID` - ID таблицы

## 6. Тестирование

1. Добавьте тестового партнера в лист "Партнеры"
2. Добавьте продажу в лист "Продажи"
3. Проверьте автоматическое создание начислений

## 7. Пример данных

### Пример записи в лист "Партнеры":
```
1672531200000 | 123456789 | Иван | Петров | +7(999)123-45-67 | ivan@example.com | ivan_petrov | PARTNERABC123 | STARTER001 | 987654321 | 2024-01-01 | 5000 | 10
```

### Пример записи в лист "Продажи":
```
SALE001 | 2024-01-15 | 10000 | PARTNERABC123
```
