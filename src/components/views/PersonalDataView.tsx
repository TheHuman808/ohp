
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface TelegramUser {
  id: string;
  first_name: string;
  username?: string;
}

interface PersonalDataViewProps {
  onComplete: (data: { firstName: string; lastName: string; phone: string; email: string }) => void;
  loading: boolean;
  telegramUser?: TelegramUser | null;
}

const PersonalDataView = ({ onComplete, loading, telegramUser }: PersonalDataViewProps) => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const { toast } = useToast();

  // Автозаполнение данных из Telegram
  useEffect(() => {
    if (telegramUser) {
      console.log('Auto-filling data from Telegram user:', telegramUser);
      
      // Заполняем имя из Telegram
      if (telegramUser.first_name) {
        setFirstName(telegramUser.first_name);
        console.log('Auto-filled first name from Telegram:', telegramUser.first_name);
      }
      
      // Пытаемся получить номер телефона из Telegram Web App
      let phoneNumber = null;
      
      // 1. Проверяем initDataUnsafe
      if (window.Telegram?.WebApp?.initDataUnsafe?.user?.phone_number) {
        phoneNumber = window.Telegram.WebApp.initDataUnsafe.user.phone_number;
        console.log('Phone from initDataUnsafe:', phoneNumber);
      }
      
      // 2. Проверяем initData как альтернативный источник
      if (!phoneNumber && window.Telegram?.WebApp?.initData) {
        try {
          const initData = new URLSearchParams(window.Telegram.WebApp.initData);
          const userParam = initData.get('user');
          if (userParam) {
            const user = JSON.parse(decodeURIComponent(userParam));
            if (user.phone_number) {
              phoneNumber = user.phone_number;
              console.log('Phone from initData:', phoneNumber);
            }
          }
        } catch (error) {
          console.warn('Error parsing initData for phone:', error);
        }
      }
      
      // Устанавливаем номер телефона, если найден
      if (phoneNumber) {
        setPhone(phoneNumber);
        console.log('Auto-filled phone from Telegram:', phoneNumber);
      } else {
        console.log('No phone number available in Telegram data');
      }
      
      // Логируем все доступные данные Telegram
      if (window.Telegram?.WebApp?.initDataUnsafe?.user) {
        const user = window.Telegram.WebApp.initDataUnsafe.user;
        console.log('Full Telegram user data available:', {
          id: user.id,
          first_name: user.first_name,
          last_name: user.last_name,
          username: user.username,
          language_code: user.language_code,
          is_premium: user.is_premium,
          phone_number: user.phone_number
        });
      }
    }
  }, [telegramUser]);

  const handleSubmit = () => {
    console.log('=== PERSONAL DATA SUBMIT ===');
    console.log('Form data:', { firstName, lastName, phone, email });
    console.log('Telegram user:', telegramUser);
    console.log('onComplete function:', onComplete);

    if (!firstName.trim() || !lastName.trim() || !phone.trim() || !email.trim()) {
      console.log('Validation failed - missing fields');
      toast({
        title: "Ошибка",
        description: "Заполните все поля",
        variant: "destructive"
      });
      return;
    }

    // Простая валидация email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({
        title: "Ошибка",
        description: "Введите корректный email адрес",
        variant: "destructive"
      });
      return;
    }

    // Простая валидация телефона
    const phoneRegex = /^[\+]?[1-9][\d]{10,14}$/;
    if (!phoneRegex.test(phone.replace(/\s+/g, ''))) {
      toast({
        title: "Ошибка",
        description: "Введите корректный номер телефона",
        variant: "destructive"
      });
      return;
    }

    console.log('Validation passed, submitting data...');
    console.log('Calling onComplete with data:', {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: phone.trim(),
      email: email.trim()
    });
    
    onComplete({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: phone.trim(),
      email: email.trim()
    });
    
    console.log('onComplete called successfully');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-md mx-auto pt-20">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-gray-800">
              Персональные данные
            </CardTitle>
            <CardDescription>
              Заполните ваши контактные данные для завершения регистрации
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="firstName">Имя *</Label>
              <Input
                id="firstName"
                type="text"
                placeholder="Введите ваше имя"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                disabled={loading}
              />
            </div>
            <div>
              <Label htmlFor="lastName">Фамилия *</Label>
              <Input
                id="lastName"
                type="text"
                placeholder="Введите вашу фамилию"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                disabled={loading}
              />
            </div>
            <div>
              <Label htmlFor="phone">Номер телефона *</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+7 (999) 123-45-67"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={loading}
              />
            </div>
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="example@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>
            <Button 
              onClick={handleSubmit}
              className="w-full bg-blue-600 hover:bg-blue-700"
              disabled={loading}
            >
              {loading ? "Регистрация..." : "Завершить регистрацию"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PersonalDataView;
