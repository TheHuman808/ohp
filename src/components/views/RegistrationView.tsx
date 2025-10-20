
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { googleSheetsService } from "@/services/googleSheetsService";

interface TelegramUser {
  id: string;
  first_name: string;
  username?: string;
}

interface RegistrationViewProps {
  telegramUser: TelegramUser | null;
  onPromoCodeSuccess: (inviterCode: string) => void;
  onExistingUserLogin: () => void;
  onNewUserRegistration?: () => void;
  partnerLoading: boolean;
}

const RegistrationView = ({ telegramUser, onPromoCodeSuccess, onExistingUserLogin, onNewUserRegistration, partnerLoading }: RegistrationViewProps) => {
  const [inviterCode, setInviterCode] = useState("");
  const [validating, setValidating] = useState(false);
  const { toast } = useToast();

  const handlePromoCodeSubmit = async () => {
    console.log('=== PROMO CODE VALIDATION FOR NEW USER START ===');
    console.log('Entered promo code:', inviterCode);
    console.log('Telegram user:', telegramUser);

    if (!inviterCode.trim()) {
      toast({
        title: "Ошибка",
        description: "Введите промокод пригласившего вас партнера",
        variant: "destructive"
      });
      return;
    }

    if (!telegramUser) {
      toast({
        title: "Ошибка",
        description: "Ошибка получения данных Telegram",
        variant: "destructive"
      });
      return;
    }

    setValidating(true);
    
    try {
      console.log('Starting validation for promo code (NEW USER REGISTRATION):', inviterCode);
      
      // Проверяем существование промокода
      const isValidCode = await googleSheetsService.validatePromoCode(inviterCode);
      
      console.log('Validation result:', isValidCode);
      
      if (!isValidCode) {
        console.log('Promo code validation failed');
        toast({
          title: "Ошибка",
          description: "Промокод не найден. Проверьте правильность ввода.",
          variant: "destructive"
        });
        return;
      }

      console.log('Promo code is valid, proceeding to NEW USER registration...');
      toast({
        title: "Успешно!",
        description: "Промокод подтвержден. Заполните персональные данные для создания нового аккаунта.",
      });
      
      // Переходим к регистрации НОВОГО пользователя
      onPromoCodeSuccess(inviterCode);
    } catch (error) {
      console.error('=== ERROR VALIDATING PROMO CODE ===');
      console.error('Error details:', error);
      
      toast({
        title: "Ошибка подключения",
        description: "Не удалось проверить промокод. Попробуйте еще раз.",
        variant: "destructive"
      });
    } finally {
      setValidating(false);
      console.log('=== PROMO CODE VALIDATION END ===');
    }
  };

  const handleExistingUserLogin = () => {
    console.log('Existing user login clicked for user:', telegramUser);
    toast({
      title: "Вход в аккаунт",
      description: "Проверяем существующий аккаунт через Telegram...",
    });
    onExistingUserLogin();
  };

  // Определяем отображаемое имя пользователя из реальных данных Telegram
  const displayName = telegramUser?.first_name || 'Пользователь';
  const displayId = telegramUser?.id || 'не определен';
  const displayUsername = telegramUser?.username || 'не указан';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-md mx-auto pt-20">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-gray-800">
              Добро пожаловать!
            </CardTitle>
            <CardDescription>
              {displayName}, введите промокод для создания нового аккаунта или войдите в существующий
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Input
                type="text"
                placeholder="Промокод партнера"
                value={inviterCode}
                onChange={(e) => setInviterCode(e.target.value.toUpperCase())}
                className="text-center text-lg font-mono"
                disabled={validating || partnerLoading}
              />
            </div>
            <Button 
              onClick={handlePromoCodeSubmit}
              className="w-full bg-blue-600 hover:bg-blue-700"
              disabled={partnerLoading || validating}
            >
              {validating ? "Проверка промокода..." : partnerLoading ? "Загрузка..." : "Создать новый аккаунт"}
            </Button>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">или</span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-2">
              <Button 
                onClick={handleExistingUserLogin}
                variant="outline"
                className="w-full"
                disabled={partnerLoading}
              >
                {partnerLoading ? "Загрузка..." : "У меня уже есть аккаунт"}
              </Button>
              
              {onNewUserRegistration && (
                <Button 
                  onClick={onNewUserRegistration}
                  variant="outline"
                  className="w-full"
                  disabled={partnerLoading}
                >
                  {partnerLoading ? "Загрузка..." : "Я новый пользователь (без промокода)"}
                </Button>
              )}
            </div>
            
            <div className="text-xs text-gray-500 text-center mt-4">
              <p>Telegram ID: {displayId}</p>
              <p>Username: @{displayUsername}</p>
              {window.Telegram?.WebApp ? (
                <p className="text-green-600 mt-1">✓ Telegram Web App</p>
              ) : (
                <p className="text-orange-600 mt-1">⚠ Тестовый режим</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RegistrationView;
