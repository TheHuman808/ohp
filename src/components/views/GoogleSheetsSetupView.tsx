
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { googleSheetsService } from "@/services/googleSheetsService";
import { CheckCircle, Copy, ExternalLink } from "lucide-react";

const GoogleSheetsSetupView = () => {
  const [connectionStatus, setConnectionStatus] = useState<{success: boolean; message: string} | null>(null);
  const [testing, setTesting] = useState(false);
  const { toast } = useToast();

  const handleTestConnection = async () => {
    setTesting(true);
    try {
      const result = await googleSheetsService.testConnection();
      setConnectionStatus(result);
      
      if (result.success) {
        toast({
          title: "Подключение успешно!",
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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Скопировано",
      description: "Заголовки скопированы в буфер обмена",
    });
  };

  const partnersHeaders = [
    "ID", "Telegram ID", "Имя", "Фамилия", "Телефон", "Email", 
    "Username", "Промокод", "Код пригласившего", "Telegram ID пригласившего", 
    "Дата регистрации", "Общий доход", "Количество продаж"
  ];

  const salesHeaders = [
    "ID", "Дата", "Сумма", "Промокод", "Информация о клиенте", "Статус"
  ];

  const commissionsHeaders = [
    "ID", "ID продажи", "Telegram ID партнера", "Уровень", "Сумма", "Процент", "Дата"
  ];

  const settingsData = [
    ["Уровень 1", "8"],
    ["Уровень 2", "4"],
    ["Уровень 3", "2"],
    ["Уровень 4", "1"]
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto pt-8">
        <Card className="mb-6">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold text-gray-800">
              Настройка Google Sheets
            </CardTitle>
            <CardDescription>
              Создайте необходимые вкладки и таблицы для партнерской программы
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 justify-center mb-4">
              <Button 
                onClick={handleTestConnection}
                className="bg-green-600 hover:bg-green-700"
                disabled={testing}
              >
                {testing ? "Проверка..." : "Тест подключения"}
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => window.open('https://docs.google.com/spreadsheets/', '_blank')}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Открыть Google Sheets
              </Button>
            </div>

            {connectionStatus && (
              <div className={`p-4 rounded-lg mb-4 ${
                connectionStatus.success 
                  ? 'bg-green-50 border border-green-200 text-green-800'
                  : 'bg-red-50 border border-red-200 text-red-800'
              }`}>
                <div className="flex items-center gap-2">
                  {connectionStatus.success && <CheckCircle className="w-5 h-5" />}
                  <span className="font-semibold">{connectionStatus.message}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Tabs defaultValue="partners" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="partners">Партнеры</TabsTrigger>
            <TabsTrigger value="sales">Продажи</TabsTrigger>
            <TabsTrigger value="commissions">Начисления</TabsTrigger>
            <TabsTrigger value="settings">Настройки</TabsTrigger>
          </TabsList>

          <TabsContent value="partners">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Вкладка "Партнеры"</CardTitle>
                    <CardDescription>
                      Создайте вкладку с именем "Партнеры" и добавьте эти заголовки в первую строку
                    </CardDescription>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => copyToClipboard(partnersHeaders.join('\t'))}
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Копировать заголовки
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      {partnersHeaders.map((header, index) => (
                        <TableHead key={index} className="text-xs font-semibold">
                          {String.fromCharCode(65 + index)}. {header}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      {partnersHeaders.map((_, index) => (
                        <TableCell key={index} className="text-xs text-gray-500">
                          Колонка {String.fromCharCode(65 + index)}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sales">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Вкладка "Продажи"</CardTitle>
                    <CardDescription>
                      Создайте вкладку с именем "Продажи" и добавьте эти заголовки в первую строку
                    </CardDescription>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => copyToClipboard(salesHeaders.join('\t'))}
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Копировать заголовки
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      {salesHeaders.map((header, index) => (
                        <TableHead key={index} className="text-xs font-semibold">
                          {String.fromCharCode(65 + index)}. {header}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      {salesHeaders.map((_, index) => (
                        <TableCell key={index} className="text-xs text-gray-500">
                          Колонка {String.fromCharCode(65 + index)}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="commissions">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Вкладка "Начисления"</CardTitle>
                    <CardDescription>
                      Создайте вкладку с именем "Начисления" и добавьте эти заголовки в первую строку
                    </CardDescription>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => copyToClipboard(commissionsHeaders.join('\t'))}
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Копировать заголовки
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      {commissionsHeaders.map((header, index) => (
                        <TableHead key={index} className="text-xs font-semibold">
                          {String.fromCharCode(65 + index)}. {header}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      {commissionsHeaders.map((_, index) => (
                        <TableCell key={index} className="text-xs text-gray-500">
                          Колонка {String.fromCharCode(65 + index)}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Вкладка "Настройки"</CardTitle>
                    <CardDescription>
                      Создайте вкладку с именем "Настройки" и добавьте процентные ставки для уровней
                    </CardDescription>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => copyToClipboard("Уровень\tПроцент\n" + settingsData.map(row => row.join('\t')).join('\n'))}
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Копировать данные
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-semibold">A. Уровень</TableHead>
                      <TableHead className="font-semibold">B. Процент</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {settingsData.map((row, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{row[0]}</TableCell>
                        <TableCell>{row[1]}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Инструкции по настройке</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-800 mb-2">Пошаговая настройка:</h3>
              <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                <li>Откройте Google Sheets и создайте новую таблицу</li>
                <li>Создайте 4 вкладки: "Партнеры", "Продажи", "Начисления", "Настройки"</li>
                <li>В каждой вкладке добавьте соответствующие заголовки в первую строку</li>
                <li>Предоставьте доступ на редактирование для: sheets-editor@carpool-453610.iam.gserviceaccount.com</li>
                <li>Скопируйте ID таблицы из URL и добавьте в переменные окружения</li>
              </ol>
            </div>
            
            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
              <h3 className="font-semibold text-yellow-800 mb-2">Важно:</h3>
              <ul className="text-sm text-yellow-700 space-y-1 list-disc list-inside">
                <li>Названия вкладок должны точно совпадать с указанными</li>
                <li>Service Account должен иметь права редактора</li>
                <li>ID таблицы находится в URL между /d/ и /edit</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default GoogleSheetsSetupView;
