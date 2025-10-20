import { useState, useEffect } from 'react';
import { googleSheetsService, type PartnerRecord, type CommissionRecord } from '@/services/googleSheetsService';

export const usePartner = (telegramId: string, forceRefresh: number = 0) => {
  const [partner, setPartner] = useState<PartnerRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPartner = async () => {
    if (!telegramId) {
      console.log('No Telegram ID provided, skipping fetch');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('=== FETCHING PARTNER DATA ===');
      console.log('Searching for Telegram ID:', telegramId);
      
      // Получаем данные ТОЛЬКО для этого конкретного пользователя
      const partnerData = await googleSheetsService.getPartner(telegramId);
      
      if (partnerData) {
        console.log('Partner found for this user:', partnerData);
        setPartner(partnerData);
      } else {
        console.log('No partner found for this Telegram ID:', telegramId);
        setPartner(null);
        
        // Проверяем fallback только для этого пользователя
        const fallbackData = localStorage.getItem(`fallback_partner_${telegramId}`);
        if (fallbackData) {
          const fallbackPartner = JSON.parse(fallbackData);
          console.log('Loaded partner from fallback storage:', fallbackPartner);
          setPartner(fallbackPartner);
        }
      }
      
    } catch (err) {
      console.error('Error fetching partner:', err);
      setError('Ошибка загрузки данных партнера');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPartner();
  }, [telegramId, forceRefresh]);

  const registerPartner = async (
    inviterCode: string, 
    personalData: { 
      firstName: string; 
      lastName: string; 
      phone: string; 
      email: string; 
    }, 
    username?: string
  ) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('=== STARTING NEW PARTNER REGISTRATION ===');
      console.log('Personal data:', personalData);
      console.log('Inviter code:', inviterCode);
      console.log('Telegram ID:', telegramId);
      console.log('Username:', username);
      
      // Создаем НОВОГО партнера
      const result = await googleSheetsService.registerPartner({
        telegramId,
        firstName: personalData.firstName,
        lastName: personalData.lastName,
        phone: personalData.phone,
        email: personalData.email,
        username,
        inviterCode
      });

      console.log('Registration result:', result);

      if (result.success && result.promoCode) {
        console.log('New partner registration successful, refreshing data...');
        
        // Принудительно обновляем данные после успешной регистрации
        await fetchPartner();
        
        return { success: true, promoCode: result.promoCode };
      } else {
        const errorMessage = result.error || 'Ошибка регистрации';
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }
    } catch (err) {
      const errorMessage = 'Ошибка при регистрации партнера';
      console.error('Error registering partner:', err);
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  return {
    partner,
    loading,
    error,
    registerPartner,
    refreshPartner: fetchPartner
  };
};

export const usePartnerCommissions = (telegramId: string) => {
  const [commissions, setCommissions] = useState<CommissionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCommissions = async () => {
    if (!telegramId) {
      console.log('No Telegram ID provided, skipping commissions fetch');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('=== FETCHING COMMISSIONS FOR USER ===');
      console.log('Telegram ID:', telegramId);
      
      // Получаем начисления ТОЛЬКО для этого пользователя
      const commissionsData = await googleSheetsService.getPartnerCommissions(telegramId);
      
      console.log(`Found ${commissionsData.length} commissions for user:`, commissionsData);
      setCommissions(commissionsData);
    } catch (err) {
      console.error('Error fetching commissions:', err);
      setError('Ошибка загрузки начислений');
      setCommissions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommissions();
  }, [telegramId]);

  return {
    commissions,
    loading,
    error,
    refresh: fetchCommissions
  };
};

export const usePartnerNetwork = (telegramId: string) => {
  const [network, setNetwork] = useState<{
    level1: PartnerRecord[];
    level2: PartnerRecord[];
    level3: PartnerRecord[];
    level4: PartnerRecord[];
  }>({ level1: [], level2: [], level3: [], level4: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNetwork = async () => {
    if (!telegramId) {
      console.log('No Telegram ID provided, skipping network fetch');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('=== FETCHING NETWORK FOR USER ===');
      console.log('Telegram ID:', telegramId);
      
      // Получаем сеть ТОЛЬКО для этого пользователя
      const networkData = await googleSheetsService.getPartnerNetwork(telegramId);
      
      console.log('Network data for user:', networkData);
      setNetwork(networkData);
    } catch (err) {
      console.error('Error fetching network:', err);
      setError('Ошибка загрузки структуры сети');
      setNetwork({ level1: [], level2: [], level3: [], level4: [] });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNetwork();
  }, [telegramId]);

  return {
    network,
    loading,
    error,
    refresh: fetchNetwork
  };
};
