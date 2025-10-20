
import { useState, useEffect } from "react";
import { usePartner } from "@/hooks/useGoogleSheets";
import RegistrationView from "@/components/views/RegistrationView";
import PersonalDataView from "@/components/views/PersonalDataView";
import DashboardView from "@/components/views/DashboardView";
import StatsView from "@/components/views/StatsView";
import NetworkView from "@/components/views/NetworkView";
import { usePartnerCommissions, usePartnerNetwork } from "@/hooks/useGoogleSheets";
import { googleSheetsService } from "@/services/googleSheetsService";
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface TelegramUser {
  id: string;
  first_name: string;
  username?: string;
}

const Index = () => {
  const [telegramUser, setTelegramUser] = useState<TelegramUser | null>(null);
  const [currentView, setCurrentView] = useState<"registration" | "personalData" | "dashboard" | "stats" | "network">("registration");
  const [inviterCode, setInviterCode] = useState("");
  const [loggedOut, setLoggedOut] = useState(false);
  const [forceRefresh, setForceRefresh] = useState(0);
  const [isExistingUserLogin, setIsExistingUserLogin] = useState(false);
  const [showUserNotFoundDialog, setShowUserNotFoundDialog] = useState(false);

  useEffect(() => {
    console.log('=== TELEGRAM DATA INITIALIZATION ===');
    
    // Функция для инициализации Telegram Web App
    const initializeTelegramWebApp = () => {
      if (window.Telegram?.WebApp) {
        const webApp = window.Telegram.WebApp;
        
        // Инициализируем Web App
        if (webApp.ready) {
          webApp.ready();
          console.log('✓ Telegram WebApp.ready() called');
        }
        
        // Разворачиваем на весь экран
        if (webApp.expand) {
          webApp.expand();
          console.log('✓ Telegram WebApp.expand() called');
        }
        
        // Настраиваем тему
        if (webApp.setHeaderColor) {
          webApp.setHeaderColor('#ffffff');
        }
        
        // Настраиваем кнопку закрытия
        if (webApp.enableClosingConfirmation) {
          webApp.enableClosingConfirmation();
        }
        
        console.log('✓ Telegram Web App fully initialized');
        return true;
      }
      return false;
    };

    // Функция для получения данных пользователя
    const getTelegramUserData = () => {
      // Проверяем несколько источников данных Telegram
      let userData = null;
      
      // 1. Основной источник - initDataUnsafe
      if (window.Telegram?.WebApp?.initDataUnsafe?.user) {
        const user = window.Telegram.WebApp.initDataUnsafe.user;
        console.log('✓ Real Telegram user data from initDataUnsafe:', {
          id: user.id,
          first_name: user.first_name,
          last_name: user.last_name,
          username: user.username,
          language_code: user.language_code,
          is_premium: user.is_premium,
          phone_number: user.phone_number
        });
        
        userData = {
          id: user.id.toString(),
          first_name: user.first_name,
          username: user.username || undefined
        };
      }
      
      // 2. Альтернативный источник - initData (если initDataUnsafe недоступен)
      if (!userData && window.Telegram?.WebApp?.initData) {
        try {
          const initData = new URLSearchParams(window.Telegram.WebApp.initData);
          const userParam = initData.get('user');
          if (userParam) {
            const user = JSON.parse(decodeURIComponent(userParam));
            console.log('✓ Real Telegram user data from initData:', user);
            
            userData = {
              id: user.id.toString(),
              first_name: user.first_name,
              username: user.username || undefined
            };
          }
        } catch (error) {
          console.warn('Error parsing initData:', error);
        }
      }
      
      return userData;
    };

    // Инициализируем Telegram Web App
    const isTelegramWebApp = initializeTelegramWebApp();
    
    // Получаем данные пользователя
    const userData = getTelegramUserData();
    
    if (userData) {
      console.log('✓ Using real Telegram user data');
      setTelegramUser(userData);
      return;
    }

    // Fallback - проверяем URL параметры (для тестирования)
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    const first_name = params.get('first_name');
    const username = params.get('username');

    if (id && first_name) {
      console.log('✓ Telegram data from URL params:', { id, first_name, username });
      setTelegramUser({
        id,
        first_name,
        username: username || undefined
      });
      return;
    }

    // Для локальной разработки - генерируем уникальный тестовый ID
    const uniqueTestId = `test_user_${Math.random().toString(36).substr(2, 9)}`;
    console.warn('⚠ No real Telegram data available. Using test user:', uniqueTestId);
    console.warn('⚠ Приложение должно быть запущено через Telegram бота для получения реальных данных');
    
    setTelegramUser({
      id: uniqueTestId,
      first_name: 'Тестовый пользователь',
      username: 'testuser'
    });
  }, []);

  const { 
    partner, 
    loading: partnerLoading, 
    error: partnerError, 
    registerPartner,
    refreshPartner
  } = usePartner(loggedOut ? '' : (telegramUser?.id || ''), forceRefresh);

  const { 
    commissions, 
    loading: commissionsLoading, 
    error: commissionsError,
    refresh: refreshCommissions
  } = usePartnerCommissions(loggedOut ? '' : (telegramUser?.id || ''));

  const {
    network,
    loading: networkLoading,
    error: networkError
  } = usePartnerNetwork(loggedOut ? '' : (telegramUser?.id || ''));

  const handlePromoCodeSuccess = (validInviterCode: string) => {
    console.log('Promo code validated successfully, proceeding to NEW USER registration:', validInviterCode);
    setInviterCode(validInviterCode);
    setLoggedOut(false);
    setIsExistingUserLogin(false);
    // Переходим к регистрации НОВОГО пользователя
    setCurrentView("personalData");
  };

  const handleNewUserRegistration = () => {
    console.log('New user registration initiated for Telegram ID:', telegramUser?.id);
    setLoggedOut(false);
    setIsExistingUserLogin(false);
    setInviterCode(""); // Очищаем промокод, так как это новый пользователь
    setCurrentView("personalData");
  };

  const handleUserNotFoundDialogClose = () => {
    setShowUserNotFoundDialog(false);
    setIsExistingUserLogin(false);
    setCurrentView("personalData");
  };

  const handleExistingUserLogin = async () => {
    console.log('Existing user login initiated for Telegram ID:', telegramUser?.id);
    setLoggedOut(false);
    setIsExistingUserLogin(true);
    
    // Проверяем существующего пользователя через Google Sheets
    if (telegramUser?.id) {
      try {
        const existingPartner = await googleSheetsService.getPartner(telegramUser.id);
        if (existingPartner) {
          console.log('Existing partner found:', existingPartner);
          // Пользователь найден, обновляем данные
          setForceRefresh(prev => prev + 1);
        } else {
          console.log('No existing partner found, showing warning and redirecting to registration');
          // Пользователь не найден, показываем диалог
          setShowUserNotFoundDialog(true);
        }
      } catch (error) {
        console.error('Error checking existing user:', error);
        // Показываем диалог об ошибке
        setShowUserNotFoundDialog(true);
      }
    }
  };

  const handleRegistrationSuccess = () => {
    console.log('=== NEW USER REGISTRATION COMPLETED SUCCESSFULLY ===');
    setLoggedOut(false);
    setIsExistingUserLogin(false);
    setInviterCode(""); // Очищаем промокод после регистрации
    // После успешной регистрации сразу переходим в дашборд
    setCurrentView("dashboard");
    // Обновляем данные партнера и комиссий
    setForceRefresh(prev => prev + 1);
    refreshCommissions();
    console.log('Redirecting to dashboard...');
  };

  const handleViewChange = (view: "registration" | "dashboard" | "stats" | "network" | "personalData") => {
    setCurrentView(view);
  };

  const handleLogout = () => {
    console.log('Logging out user:', telegramUser?.id);
    // Очищаем все локальные данные
    googleSheetsService.clearAllLocalData();
    // Устанавливаем флаг выхода
    setLoggedOut(true);
    // Сбрасываем все состояние
    setInviterCode("");
    setIsExistingUserLogin(false);
    setCurrentView("registration");
    // Принудительно обновляем хуки для сброса данных партнера
    setForceRefresh(prev => prev + 1);
    console.log('Logged out successfully');
  };

  const handlePersonalDataComplete = async (personalData: { firstName: string; lastName: string; phone: string; email: string }) => {
    if (!telegramUser) {
      console.error('No telegram user data');
      return;
    }
    
    console.log('=== STARTING NEW USER REGISTRATION PROCESS ===');
    console.log('Personal data:', personalData);
    console.log('Inviter code:', inviterCode);
    console.log('Telegram user:', telegramUser);
    
    // Если нет промокода пригласившего, используем пустую строку (новый пользователь без реферала)
    const inviterCodeToUse = inviterCode || '';
    
    const result = await registerPartner(
      inviterCodeToUse,
      personalData,
      telegramUser.username
    );
    
    console.log('Registration result:', result);
    
    if (result.success) {
      handleRegistrationSuccess();
    }
  };

  // Если пользователь вышел из системы, показываем только регистрацию
  if (loggedOut) {
    if (currentView === "personalData") {
      return (
        <PersonalDataView
          onComplete={handlePersonalDataComplete}
          loading={partnerLoading}
          telegramUser={telegramUser}
        />
      );
    }

    return (
      <RegistrationView
        telegramUser={telegramUser}
        onPromoCodeSuccess={handlePromoCodeSuccess}
        onExistingUserLogin={handleExistingUserLogin}
        onNewUserRegistration={handleNewUserRegistration}
        partnerLoading={partnerLoading}
      />
    );
  }

  // Если данные еще загружаются
  if (partnerLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка данных...</p>
        </div>
      </div>
    );
  }

  // Если есть ошибка загрузки
  if (partnerError) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-800 mb-4">
            Ошибка
          </h1>
          <p className="text-red-600">{partnerError}</p>
        </div>
      </div>
    );
  }

  // Если партнер найден
  if (partner) {
    if (currentView === "stats") {
      return (
        <StatsView
          commissions={commissions}
          commissionsLoading={commissionsLoading}
          currentView={currentView}
          onViewChange={handleViewChange}
          onLogout={handleLogout}
        />
      );
    }

    if (currentView === "network") {
      return (
        <NetworkView
          network={network}
          networkLoading={networkLoading}
          currentView={currentView}
          onViewChange={handleViewChange}
          onLogout={handleLogout}
        />
      );
    }

    // По умолчанию показываем дашборд для найденного пользователя
    return (
      <DashboardView
        partner={partner}
        commissions={commissions}
        currentView={currentView}
        onViewChange={handleViewChange}
        onLogout={handleLogout}
      />
    );
  }

  // Если это попытка входа существующего пользователя, но партнер не найден
  if (isExistingUserLogin && !partner && !partnerLoading) {
    console.log('Existing user not found, redirecting to registration');
    setIsExistingUserLogin(false);
    setCurrentView("registration");
  }

  // Если мы в процессе регистрации НОВОГО пользователя
  if (currentView === "personalData" && !isExistingUserLogin) {
    return (
      <PersonalDataView
        onComplete={handlePersonalDataComplete}
        loading={partnerLoading}
        telegramUser={telegramUser}
      />
    );
  }

  // По умолчанию показываем экран ввода промокода
  return (
    <>
      <RegistrationView
        telegramUser={telegramUser}
        onPromoCodeSuccess={handlePromoCodeSuccess}
        onExistingUserLogin={handleExistingUserLogin}
        onNewUserRegistration={handleNewUserRegistration}
        partnerLoading={partnerLoading}
      />
      
      <AlertDialog open={showUserNotFoundDialog} onOpenChange={setShowUserNotFoundDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Пользователь не найден</AlertDialogTitle>
            <AlertDialogDescription>
              Аккаунт с вашим Telegram ID не найден в базе данных. 
              Создаем новый аккаунт для вас.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={handleUserNotFoundDialogClose}>
              Создать аккаунт
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default Index;
