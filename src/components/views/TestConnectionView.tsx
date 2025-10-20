
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { googleSheetsService } from "@/services/googleSheetsService";

const TestConnectionView = () => {
  const [testing, setTesting] = useState(false);
  const [connectionResult, setConnectionResult] = useState<any>(null);
  const { toast } = useToast();

  const handleTestConnection = async () => {
    setTesting(true);
    setConnectionResult(null);
    
    try {
      const result = await googleSheetsService.testConnection();
      setConnectionResult(result);
      
      if (result.success) {
        toast({
          title: "Успешно!",
          description: result.message,
        });
      } else {
        toast({
          title: "Ошибка подключения",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
      toast({
        title: "Ошибка",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setTesting(false);
    }
  };

  const handleClearData = () => {
    googleSheetsService.clearAllLocalData();
    toast({
      title: "Данные очищены",
      description: "Все локальные данные партнеров удалены",
    });
    // Перезагружаем страницу для полной очистки состояния
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-2xl mx-auto pt-20">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-gray-800">
              Тестирование Google Sheets
            </CardTitle>
            <CardDescription>
              Проверка подключения к Google Sheets API
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button 
                onClick={handleTestConnection}
                className="w-full bg-green-600 hover:bg-green-700"
                disabled={testing}
              >
                {testing ? "Проверка..." : "Тест подключения"}
              </Button>
              
              <Button 
                onClick={handleClearData}
                variant="destructive"
                className="w-full"
              >
                Очистить данные
              </Button>
            </div>

            {connectionResult && (
              <div className={`p-4 rounded-lg ${
                connectionResult.success 
                  ? 'bg-green-50 border border-green-200 text-green-800'
                  : 'bg-red-50 border border-red-200 text-red-800'
              }`}>
                <h3 className="font-semibold mb-2">Результат подключения:</h3>
                <p className="mb-2">{connectionResult.message}</p>
                
                {connectionResult.details && (
                  <details className="mt-4">
                    <summary className="cursor-pointer font-medium">Подробности</summary>
                    <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
                      {JSON.stringify(connectionResult.details, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-800 mb-2">Настройка переменных окружения:</h3>
              <div className="text-sm text-blue-700 space-y-1">
                <p><strong>VITE_GOOGLE_SHEETS_API_KEY</strong> - ваш API ключ из Google Cloud Console</p>
                <p><strong>VITE_GOOGLE_SHEETS_ID</strong> - ID Google таблицы из URL</p>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
              <h3 className="font-semibold text-yellow-800 mb-2">Требования к Google таблице:</h3>
              <div className="text-sm text-yellow-700 space-y-1">
                <p>• Таблица должна быть публично доступна для чтения</p>
                <p>• Листы должны называться: "Партнеры", "Продажи", "Начисления", "Настройки"</p>
                <p>• Для записи данных нужен Service Account или OAuth2</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TestConnectionView;
