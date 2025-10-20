
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { googleSheetsService } from "@/services/googleSheetsService";

const TestAppsScriptConnection = () => {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<string>("");
  const { toast } = useToast();

  // Получаем переменные окружения
  const envWebAppUrl = import.meta.env.VITE_GOOGLE_APPS_SCRIPT_URL;
  const envSheetsId = import.meta.env.VITE_GOOGLE_SHEETS_ID;
  const envApiKey = import.meta.env.VITE_GOOGLE_SHEETS_API_KEY;

  // Fallback значения из googleSheetsService
  const fallbackWebAppUrl = 'https://script.google.com/macros/s/AKfycbycArxbd3ZUd-bWzuoTFeGe1CIt339FB1G1NJ2x-0_6lVXdOksA5R8soYZ-WIMvQKUH/exec';
  const fallbackSheetsId = '1fh4-V4n0ho-RF06xcxl0JYxK5xQf8WOMSYy-tF6vRkU';
  const fallbackApiKey = 'AIzaSyD1-O9ID7-2EFVum1ITNRyrhJYtvlY5wKg';

  // Актуальные используемые значения
  const webAppUrl = envWebAppUrl || fallbackWebAppUrl;
  const sheetsId = envSheetsId || fallbackSheetsId;
  const apiKey = envApiKey || fallbackApiKey;

  const testConnection = async () => {
    setTesting(true);
    setResult("");
    
    console.log('=== DEBUGGING ENV VARS ===');
    console.log('ENV VITE_GOOGLE_APPS_SCRIPT_URL:', envWebAppUrl || 'NOT SET');
    console.log('ENV VITE_GOOGLE_SHEETS_ID:', envSheetsId || 'NOT SET');
    console.log('ENV VITE_GOOGLE_SHEETS_API_KEY:', envApiKey ? `${envApiKey.substring(0, 10)}...` : 'NOT SET');
    console.log('Using webAppUrl:', webAppUrl);
    console.log('Using sheetsId:', sheetsId ? `${sheetsId.substring(0, 10)}...` : 'NOT SET');
    console.log('Using apiKey:', apiKey ? `${apiKey.substring(0, 10)}...` : 'NOT SET');

    try {
      console.log('Testing Apps Script URL:', webAppUrl);
      
      const response = await fetch(webAppUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        }
      });
      
      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);
      
      if (response.ok) {
        const data = await response.json();
        setResult(`✅ Подключение успешно! Status: ${response.status}\nОтвет: ${JSON.stringify(data, null, 2)}`);
        toast({
          title: "Успешно!",
          description: "Подключение к Google Apps Script работает"
        });
      } else {
        const errorText = await response.text();
        setResult(`❌ HTTP ошибка: ${response.status} - ${response.statusText}\n${errorText}`);
      }
      
    } catch (error) {
      console.error('Connection test error:', error);
      const errorMessage = `❌ Ошибка подключения: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`;
      setResult(errorMessage);
      toast({
        title: "Ошибка",
        description: "Не удалось подключиться к Google Apps Script",
        variant: "destructive"
      });
    }
    
    setTesting(false);
  };

  const testRegistration = async () => {
    setTesting(true);
    setResult("Тестируем регистрацию...");
    
    try {
      const testData = {
        telegramId: 'test_' + Date.now(),
        firstName: 'Тест',
        lastName: 'Пользователь',
        phone: '+1234567890',
        email: 'test@example.com',
        username: 'testuser',
        inviterCode: 'PARTNER123456'
      };
      
      const result = await googleSheetsService.registerPartner(testData);
      
      if (result.success) {
        setResult(`✅ Тестовая регистрация успешна! Промокод: ${result.promoCode}`);
        toast({
          title: "Успешно!",
          description: `Регистрация работает! Промокод: ${result.promoCode}`
        });
      } else {
        setResult(`❌ Ошибка регистрации: ${result.error}`);
        toast({
          title: "Ошибка",
          description: result.error || "Ошибка при регистрации",
          variant: "destructive"
        });
      }
      
    } catch (error) {
      console.error('Registration test error:', error);
      const errorMessage = `❌ Ошибка тестирования: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`;
      setResult(errorMessage);
      toast({
        title: "Ошибка",
        description: "Ошибка при тестировании регистрации",
        variant: "destructive"
      });
    }
    
    setTesting(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-2xl mx-auto pt-20">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-gray-800">
              Тест Google Apps Script
            </CardTitle>
            <CardDescription>
              Проверка подключения и функциональности
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Диагностика переменных окружения */}
            <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-800 mb-2">Статус переменных окружения:</h3>
              <div className="text-sm space-y-1">
                <div className={envWebAppUrl ? 'text-green-700' : 'text-orange-600'}>
                  <strong>VITE_GOOGLE_APPS_SCRIPT_URL:</strong> 
                  {envWebAppUrl ? ' ✅ Установлена из ENV' : ' ⚠️ Используется fallback'}
                </div>
                <div className={envSheetsId ? 'text-green-700' : 'text-orange-600'}>
                  <strong>VITE_GOOGLE_SHEETS_ID:</strong> 
                  {envSheetsId ? ' ✅ Установлена из ENV' : ' ⚠️ Используется fallback'}
                </div>
                <div className={envApiKey ? 'text-green-700' : 'text-orange-600'}>
                  <strong>VITE_GOOGLE_SHEETS_API_KEY:</strong> 
                  {envApiKey ? ' ✅ Установлена из ENV' : ' ⚠️ Используется fallback'}
                </div>
              </div>
            </div>

            {/* Показываем используемые значения */}
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-800 mb-2">Используемые значения:</h3>
              <div className="text-sm text-blue-700 space-y-1 font-mono">
                <p><strong>Apps Script URL:</strong> {webAppUrl}</p>
                <p><strong>Sheets ID:</strong> {sheetsId}</p>
                <p><strong>API Key:</strong> {apiKey ? `${apiKey.substring(0, 15)}...` : 'NOT SET'}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button 
                onClick={testConnection}
                disabled={testing}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {testing ? "Тестируем..." : "Тест подключения"}
              </Button>
              
              <Button 
                onClick={testRegistration}
                disabled={testing}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {testing ? "Тестируем..." : "Тест регистрации"}
              </Button>
            </div>
            
            {result && (
              <div className={`p-4 rounded-lg ${
                result.includes('✅') 
                  ? 'bg-green-50 border border-green-200 text-green-800'
                  : 'bg-red-50 border border-red-200 text-red-800'
              }`}>
                <pre className="whitespace-pre-wrap text-sm font-mono">{result}</pre>
              </div>
            )}

            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
              <h3 className="font-semibold text-yellow-800 mb-2">Рекомендации:</h3>
              <div className="text-sm text-yellow-700 space-y-2">
                <p>🔸 <strong>Для продакшена:</strong> Установите переменные ENV в настройках Lovable</p>
                <p>🔸 <strong>Для разработки:</strong> Fallback значения работают, но лучше использовать ENV</p>
                <p>🔸 <strong>Settings → Environment Variables → Добавить переменные</strong></p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TestAppsScriptConnection;
