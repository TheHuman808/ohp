// Google Sheets API service for partner program management

interface PartnerRecord {
  id: string;
  telegramId: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  username?: string;
  promoCode: string;
  inviterCode?: string;
  inviterTelegramId?: string;
  registrationDate: string;
  totalEarnings: number;
  salesCount: number;
  partnerId?: string;
  level?: number;
}

interface SaleRecord {
  id: string;
  date: string;
  amount: number;
  promoCode: string;
  customerInfo?: string;
}

interface CommissionRecord {
  id: string;
  saleId?: string;
  partnerId?: string;
  partnerTelegramId?: string;
  level: number;
  amount: number;
  percentage: number;
  date: string;
  fromPartnerId?: string;
}

interface CommissionSettings {
  level1: number;
  level2: number;
  level3: number;
  level4: number;
}

class GoogleSheetsService {
  private spreadsheetId: string;
  private apiKey: string;
  private webAppUrl: string;
  private baseUrl = 'https://sheets.googleapis.com/v4/spreadsheets';

  constructor() {
    this.spreadsheetId = import.meta.env.VITE_GOOGLE_SHEETS_ID || '1fh4-V4n0ho-RF06xcxl0JYxK5xQf8WOMSYy-tF6vRkU';
    this.apiKey = import.meta.env.VITE_GOOGLE_SHEETS_API_KEY || 'AIzaSyD1-O9ID7-2EFVum1ITNRyrhJYtvlY5wKg';
    this.webAppUrl = import.meta.env.VITE_GOOGLE_APPS_SCRIPT_URL || 'https://script.google.com/macros/s/AKfycbzsMyAyZx5GPFoHTxZzOfE1HnMoaEwIESra0T__yGlYZmQnFDod75lVw4e_M3yLOfId/exec';
    
    console.log('GoogleSheetsService initialized:');
    console.log('Spreadsheet ID:', this.spreadsheetId ? `${this.spreadsheetId.substring(0, 10)}...` : 'NOT SET');
    console.log('API Key for read:', this.apiKey ? `${this.apiKey.substring(0, 10)}...` : 'NOT SET');
    console.log('Web App URL:', this.webAppUrl ? `${this.webAppUrl.substring(0, 30)}...` : 'NOT SET');
    
    if (!this.apiKey || !this.spreadsheetId) {
      console.warn('Google Sheets API не настроен полностью. Установите переменные окружения VITE_GOOGLE_SHEETS_API_KEY и VITE_GOOGLE_SHEETS_ID');
    }

    if (!this.webAppUrl) {
      console.warn('Google Apps Script URL не настроен. Установите VITE_GOOGLE_APPS_SCRIPT_URL для записи данных');
    }
  }

  // Очистить все данные localStorage
  clearAllLocalData(): void {
    console.log('=== CLEARING ALL LOCAL DATA ===');
    const keysToRemove: string[] = [];
    
    // Находим все ключи связанные с партнерами
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('partner_') || key.startsWith('fallback_partner_'))) {
        keysToRemove.push(key);
      }
    }
    
    // Удаляем найденные ключи
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
      console.log('Removed from localStorage:', key);
    });
    
    console.log(`Cleared ${keysToRemove.length} partner records from localStorage`);
    console.log('=== LOCAL DATA CLEARED ===');
  }

  // Проверить подключение к Google Sheets
  async testConnection(): Promise<{ success: boolean; message: string; details?: any }> {
    console.log('=== TESTING GOOGLE SHEETS CONNECTION ===');
    
    if (!this.apiKey || !this.spreadsheetId) {
      return {
        success: false,
        message: 'API ключ или ID таблицы не настроены'
      };
    }

    try {
      // Пробуем получить информацию о таблице
      const url = `${this.baseUrl}/${this.spreadsheetId}?key=${this.apiKey}`;
      console.log('Testing connection with URL:', url.replace(this.apiKey, 'API_KEY_HIDDEN'));
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (response.ok) {
        console.log('Connection successful:', data.properties?.title);
        return {
          success: true,
          message: `Подключение успешно! Таблица: ${data.properties?.title}`,
          details: data
        };
      } else {
        console.error('Connection failed:', data);
        return {
          success: false,
          message: `Ошибка подключения: ${data.error?.message || 'Неизвестная ошибка'}`,
          details: data
        };
      }
    } catch (error) {
      console.error('Connection test error:', error);
      return {
        success: false,
        message: `Ошибка сети: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`
      };
    }
  }

  // Проверить существование промокода
  async validatePromoCode(promoCode: string): Promise<boolean> {
    console.log('=== VALIDATE PROMO CODE START ===');
    console.log('Promo code to validate:', promoCode);
    
    if (!this.apiKey || !this.spreadsheetId) {
      console.error('Missing API configuration');
      throw new Error('Google Sheets API не настроен. Проверьте переменные окружения.');
    }

    try {
      const range = 'Партнеры!H:H';
      const encodedRange = encodeURIComponent(range);
      const url = `${this.baseUrl}/${this.spreadsheetId}/values/${encodedRange}?key=${this.apiKey}`;
      
      console.log('Making request to validate promo code...');
      console.log('Request URL:', url.replace(this.apiKey, 'API_KEY_HIDDEN'));
      
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        throw new Error(`API Error: ${response.status} - ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Promo codes response:', data);
      
      const codes = data.values || [];
      const isValid = codes.some((row: string[]) => {
        const code = row[0];
        return code === promoCode;
      });
      
      console.log('Validation result:', isValid);
      console.log('=== VALIDATE PROMO CODE END ===');
      
      return isValid;
    } catch (error) {
      console.error('=== VALIDATE PROMO CODE ERROR ===');
      console.error('Error validating promo code:', error);
      throw error;
    }
  }

  // Получить данные партнера по Telegram ID (только для этого конкретного пользователя)
  async getPartner(telegramId: string): Promise<PartnerRecord | null> {
    try {
      console.log('=== GET PARTNER START ===');
      console.log('Looking for partner with Telegram ID:', telegramId);
      
      if (!telegramId) {
        console.log('No telegram ID provided');
        return null;
      }
      
      const range = 'Партнеры!A:M';
      const encodedRange = encodeURIComponent(range);
      const url = `${this.baseUrl}/${this.spreadsheetId}/values/${encodedRange}?key=${this.apiKey}`;
      
      console.log('GET request URL:', url.replace(this.apiKey, 'API_KEY_HIDDEN'));
      
      // Retry logic for network errors
      let response;
      let retryCount = 0;
      const maxRetries = 3;
      
      while (retryCount < maxRetries) {
        try {
          response = await fetch(url);
          break; // Success, exit retry loop
        } catch (error) {
          retryCount++;
          console.warn(`Network error (attempt ${retryCount}/${maxRetries}):`, error);
          
          if (retryCount < maxRetries) {
            // Wait before retry (exponential backoff)
            const delay = Math.pow(2, retryCount) * 1000;
            console.log(`Retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
          } else {
            console.error('Max retries reached, giving up');
            throw error;
          }
        }
      }
      
      if (!response.ok) {
        console.error('Failed to fetch partner data:', response.status, response.statusText);
        return null;
      }

      const data = await response.json();
      const rows = data.values || [];
      console.log('Partner data rows count:', rows.length);
      
      // Ищем ТОЧНО по Telegram ID (только для этого пользователя)
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        console.log(`Checking row ${i}:`, row);
        if (row[1] === telegramId) { // Telegram ID в колонке B
          const partner = {
            id: row[0] || '',
            telegramId: row[1] || '',
            firstName: row[2] || '',
            lastName: row[3] || '',
            phone: row[4] || '',
            email: row[5] || '',
            username: row[6] || '',
            promoCode: row[7] || '',
            inviterCode: row[8] || '',
            inviterTelegramId: row[9] || '',
            registrationDate: row[10] || '',
            totalEarnings: parseFloat(row[11]) || 0,
            salesCount: parseInt(row[12]) || 0
          };
          console.log('Found partner for Telegram ID:', telegramId, partner);
          console.log('=== GET PARTNER END ===');
          return partner;
        }
      }
      
      console.log('Partner not found in Google Sheets for Telegram ID:', telegramId);
      console.log('=== GET PARTNER END ===');
      return null;
    } catch (error) {
      console.error('Error fetching partner:', error);
      return null;
    }
  }

  // Получить партнера по промокоду
  async getPartnerByPromoCode(promoCode: string): Promise<PartnerRecord | null> {
    try {
      const range = 'Партнеры!A:M';
      const encodedRange = encodeURIComponent(range);
      const response = await fetch(
        `${this.baseUrl}/${this.spreadsheetId}/values/${encodedRange}?key=${this.apiKey}`
      );
      
      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      const rows = data.values || [];
      
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (row[7] === promoCode) { // promoCode в колонке H
          return {
            id: row[0] || '',
            telegramId: row[1] || '',
            firstName: row[2] || '',
            lastName: row[3] || '',
            phone: row[4] || '',
            email: row[5] || '',
            username: row[6] || '',
            promoCode: row[7] || '',
            inviterCode: row[8] || '',
            inviterTelegramId: row[9] || '',
            registrationDate: row[10] || '',
            totalEarnings: parseFloat(row[11]) || 0,
            salesCount: parseInt(row[12]) || 0
          };
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching partner by promo code:', error);
      return null;
    }
  }

  // Улучшенный метод записи через Google Apps Script с поддержкой CORS
  private async writeToAppsScript(action: string, data: any): Promise<{ success: boolean; result?: any; error?: string }> {
    if (!this.webAppUrl) {
      console.warn('Google Apps Script URL не настроен');
      return { success: false, error: 'Apps Script URL не настроен' };
    }

    try {
      console.log('=== WRITING TO APPS SCRIPT ===');
      console.log('Action:', action);
      console.log('Data:', data);
      console.log('URL:', this.webAppUrl);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const requestOptions = {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain',
        },
        body: JSON.stringify({
          action: action,
          data: data
        }),
        signal: controller.signal,
        mode: 'cors' as RequestMode
      };

      console.log('Request options:', {
        method: requestOptions.method,
        headers: requestOptions.headers,
        bodyLength: requestOptions.body.length
      });

      // Retry logic for Apps Script requests
      let response;
      let retryCount = 0;
      const maxRetries = 3;
      
      while (retryCount < maxRetries) {
        try {
          response = await fetch(this.webAppUrl, requestOptions);
          break; // Success, exit retry loop
        } catch (error) {
          retryCount++;
          console.warn(`Apps Script network error (attempt ${retryCount}/${maxRetries}):`, error);
          
          if (retryCount < maxRetries) {
            // Wait before retry (exponential backoff)
            const delay = Math.pow(2, retryCount) * 1000;
            console.log(`Retrying Apps Script request in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
          } else {
            console.error('Max retries reached for Apps Script, giving up');
            throw error;
          }
        }
      }
      
      clearTimeout(timeoutId);

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (response.ok) {
        const result = await response.json();
        console.log('Apps Script response:', result);
        console.log('Apps Script response type:', typeof result);
        console.log('Apps Script response keys:', Object.keys(result));
        
        // Проверяем, что результат действительно успешный
        if (result.success === true) {
          console.log('✓ Apps Script confirmed success');
          return { success: true, result };
        } else {
          console.error('✗ Apps Script returned success: false');
          console.error('Apps Script error:', result.error);
          return { success: false, error: result.error || 'Apps Script returned success: false' };
        }
      } else {
        const errorText = await response.text();
        console.error('Apps Script HTTP error:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
        return { success: false, error: `HTTP ${response.status}: ${response.statusText} - ${errorText}` };
      }
    } catch (error) {
      console.error('=== APPS SCRIPT REQUEST ERROR ===');
      console.error('Error type:', error?.constructor?.name);
      console.error('Error message:', error?.message);
      console.error('Full error:', error);
      
      let errorMessage = 'Unknown error';
      
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        errorMessage = 'CORS ошибка: Google Apps Script должен быть настроен с правильными разрешениями доступа. Убедитесь, что развертывание настроено как "Anyone" в настройках доступа.';
      } else if (error?.name === 'AbortError') {
        errorMessage = 'Превышен таймаут запроса (30 секунд)';
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      return { success: false, error: errorMessage };
    }
  }

  // Зарегистрировать нового партнера (создать нового пользователя)
  async registerPartner(partnerData: {
    telegramId: string;
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    username?: string;
    inviterCode: string;
  }): Promise<{ success: boolean; promoCode?: string; error?: string }> {
    try {
      console.log('=== REGISTER PARTNER START ===');
      console.log('Registering NEW partner:', partnerData);
      
      // Сначала проверяем, не существует ли уже партнер с таким Telegram ID
      const existingPartner = await this.getPartner(partnerData.telegramId);
      if (existingPartner) {
        console.log('Partner already exists:', existingPartner);
        return { success: false, error: 'Партнер с таким Telegram ID уже зарегистрирован' };
      }
      
      // Проверяем промокод пригласившего (только если он указан)
      if (partnerData.inviterCode && partnerData.inviterCode.trim() !== '') {
        console.log('Validating inviter code:', partnerData.inviterCode);
        const isValidInviter = await this.validatePromoCode(partnerData.inviterCode);
        if (!isValidInviter) {
          console.log('Invalid inviter code, registration failed');
          return { success: false, error: 'Неверный промокод пригласившего партнера' };
        }
        console.log('Inviter code is valid');
      } else {
        console.log('No inviter code provided, skipping validation');
      }

      // Генерируем уникальный промокод для нового партнера
      const promoCode = `PARTNER${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
      console.log('Generated promo code for new partner:', promoCode);
      
      // Подготавливаем данные для записи нового партнера
      const newPartnerData = {
        telegramId: partnerData.telegramId,
        firstName: partnerData.firstName,
        lastName: partnerData.lastName,
        phone: partnerData.phone,
        email: partnerData.email,
        username: partnerData.username || '',
        promoCode: promoCode,
        inviterCode: partnerData.inviterCode && partnerData.inviterCode.trim() !== '' ? partnerData.inviterCode : null, // Send null instead of empty string
        registrationDate: new Date().toISOString().split('T')[0]
      };

      console.log('=== SENDING DATA TO GOOGLE SHEETS ===');
      console.log('Partner data to register:', newPartnerData);
      console.log('Original inviterCode:', partnerData.inviterCode);
      console.log('Processed inviterCode:', newPartnerData.inviterCode);
      console.log('inviterCode type:', typeof newPartnerData.inviterCode);
      console.log('inviterCode === null:', newPartnerData.inviterCode === null);
      console.log('inviterCode === undefined:', newPartnerData.inviterCode === undefined);
      console.log('inviterCode === "":', newPartnerData.inviterCode === '');
      console.log('Telegram ID:', partnerData.telegramId);
      console.log('Real Telegram data check:', {
        isTestUser: partnerData.telegramId.startsWith('test_user_'),
        telegramId: partnerData.telegramId,
        firstName: partnerData.firstName,
        username: partnerData.username
      });

      // Записываем нового партнера через Apps Script
      console.log('Sending data to Apps Script...');
      const writeResult = await this.writeToAppsScript('registerPartner', newPartnerData);
      
      console.log('Apps Script response:', writeResult);
      
        if (writeResult.success) {
          console.log('✓ New partner successfully registered via Apps Script');
          console.log('Apps Script result details:', writeResult.result);
          
          // Дополнительная задержка для Google Sheets
          console.log('Waiting for Google Sheets to update...');
          await new Promise(resolve => setTimeout(resolve, 5000)); // Увеличил до 5 секунд
          
          // Проверяем, что данные действительно записались
          console.log('Verifying registration in Google Sheets...');
          const verification = await this.getPartner(partnerData.telegramId);
          if (verification) {
            console.log('✓ Registration verified in Google Sheets');
            console.log('Verified partner data:', verification);
          } else {
            console.log('⚠ Registration not yet visible in Google Sheets (may take longer)');
            console.log('This might indicate an issue with the Apps Script or Google Sheets API');
            
            // Попробуем еще раз через дополнительную задержку
            console.log('Trying one more verification after additional delay...');
            await new Promise(resolve => setTimeout(resolve, 5000));
            const secondVerification = await this.getPartner(partnerData.telegramId);
            if (secondVerification) {
              console.log('✓ Registration verified on second attempt');
            } else {
              console.log('✗ Registration still not visible after 10 seconds total');
            }
          }
          
          return { success: true, promoCode: promoCode };
        } else {
          console.error('✗ Apps Script registration failed:', writeResult.error);
          return { success: false, error: writeResult.error || 'Ошибка при записи в Google Sheets' };
        }
      
    } catch (error) {
      console.error('=== REGISTER PARTNER ERROR ===');
      console.error('Registration error:', error);
      return { success: false, error: 'Ошибка при регистрации партнера' };
    }
  }

  // Получить начисления конкретного партнера (только его данные)
  async getPartnerCommissions(telegramId: string): Promise<CommissionRecord[]> {
    try {
      console.log('=== GET PARTNER COMMISSIONS START ===');
      console.log('Getting commissions for Telegram ID:', telegramId);
      
      if (!telegramId) {
        console.log('No telegram ID provided');
        return [];
      }
      
      const range = 'Начисления!A:G';
      const encodedRange = encodeURIComponent(range);
      const url = `${this.baseUrl}/${this.spreadsheetId}/values/${encodedRange}?key=${this.apiKey}`;
      
      // Retry logic for network errors
      let response;
      let retryCount = 0;
      const maxRetries = 3;
      
      while (retryCount < maxRetries) {
        try {
          response = await fetch(url);
          break; // Success, exit retry loop
        } catch (error) {
          retryCount++;
          console.warn(`Commissions network error (attempt ${retryCount}/${maxRetries}):`, error);
          
          if (retryCount < maxRetries) {
            // Wait before retry (exponential backoff)
            const delay = Math.pow(2, retryCount) * 1000;
            console.log(`Retrying commissions fetch in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
          } else {
            console.error('Max retries reached for commissions, giving up');
            throw error;
          }
        }
      }
      
      if (!response.ok) {
        console.error('Failed to fetch commissions:', response.status);
        return [];
      }

      const data = await response.json();
      const rows = data.values || [];
      const commissions: CommissionRecord[] = [];
      
      console.log('Commissions data rows count:', rows.length);
      
      // Ищем начисления ТОЛЬКО для этого конкретного партнера
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        console.log(`Checking commission row ${i}:`, row);
        
        if (row[2] === telegramId) { // partnerTelegramId в колонке C
          const commission = {
            id: row[0] || '',
            saleId: row[1] || '',
            partnerTelegramId: row[2] || '',
            level: parseInt(row[3]) || 1,
            amount: parseFloat(row[4]) || 0,
            percentage: parseFloat(row[5]) || 0,
            date: row[6] || ''
          };
          
          console.log('Found commission for partner:', commission);
          commissions.push(commission);
        }
      }
      
      console.log(`Found ${commissions.length} commissions for partner ${telegramId}`);
      console.log('=== GET PARTNER COMMISSIONS END ===');
      
      return commissions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } catch (error) {
      console.error('Error fetching partner commissions:', error);
      return [];
    }
  }

  // Получить сеть партнера (только его рефералы)
  async getPartnerNetwork(telegramId: string): Promise<{
    level1: PartnerRecord[];
    level2: PartnerRecord[];
    level3: PartnerRecord[];
    level4: PartnerRecord[];
  }> {
    try {
      console.log('=== GET PARTNER NETWORK START ===');
      console.log('Getting network for Telegram ID:', telegramId);
      
      if (!telegramId) {
        console.log('No telegram ID provided');
        return { level1: [], level2: [], level3: [], level4: [] };
      }
      
      const partner = await this.getPartner(telegramId);
      if (!partner) {
        console.log('Partner not found, returning empty network');
        return { level1: [], level2: [], level3: [], level4: [] };
      }

      const range = 'Партнеры!A:M';
      const encodedRange = encodeURIComponent(range);
      const url = `${this.baseUrl}/${this.spreadsheetId}/values/${encodedRange}?key=${this.apiKey}`;
      
      // Retry logic for network errors
      let response;
      let retryCount = 0;
      const maxRetries = 3;
      
      while (retryCount < maxRetries) {
        try {
          response = await fetch(url);
          break; // Success, exit retry loop
        } catch (error) {
          retryCount++;
          console.warn(`Network data fetch error (attempt ${retryCount}/${maxRetries}):`, error);
          
          if (retryCount < maxRetries) {
            // Wait before retry (exponential backoff)
            const delay = Math.pow(2, retryCount) * 1000;
            console.log(`Retrying network fetch in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
          } else {
            console.error('Max retries reached for network data, giving up');
            throw error;
          }
        }
      }
      
      if (!response.ok) {
        console.error('Failed to fetch network data:', response.status);
        return { level1: [], level2: [], level3: [], level4: [] };
      }

      const data = await response.json();
      const rows = data.values || [];
      const allPartners: PartnerRecord[] = [];
      
      // Собираем всех партнеров
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        allPartners.push({
          id: row[0] || '',
          telegramId: row[1] || '',
          firstName: row[2] || '',
          lastName: row[3] || '',
          phone: row[4] || '',
          email: row[5] || '',
          username: row[6] || '',
          promoCode: row[7] || '',
          inviterCode: row[8] || '',
          inviterTelegramId: row[9] || '',
          registrationDate: row[10] || '',
          totalEarnings: parseFloat(row[11]) || 0,
          salesCount: parseInt(row[12]) || 0
        });
      }

      // Находим структуру по уровням (ТОЛЬКО рефералы этого партнера)
      const level1 = allPartners.filter(p => p.inviterTelegramId === telegramId);
      const level2 = allPartners.filter(p => level1.some(l1 => l1.telegramId === p.inviterTelegramId));
      const level3 = allPartners.filter(p => level2.some(l2 => l2.telegramId === p.inviterTelegramId));
      const level4 = allPartners.filter(p => level3.some(l3 => l3.telegramId === p.inviterTelegramId));

      console.log('Network found:', { 
        level1: level1.length, 
        level2: level2.length, 
        level3: level3.length, 
        level4: level4.length 
      });
      console.log('=== GET PARTNER NETWORK END ===');

      return { level1, level2, level3, level4 };
    } catch (error) {
      console.error('Error fetching partner network:', error);
      return { level1: [], level2: [], level3: [], level4: [] };
    }
  }
}

export const googleSheetsService = new GoogleSheetsService();
export type { PartnerRecord, SaleRecord, CommissionRecord, CommissionSettings };
