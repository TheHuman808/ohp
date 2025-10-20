import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Navigation from "@/components/Navigation";
import { TrendingUp, Calendar } from "lucide-react";
import type { CommissionRecord } from "@/services/googleSheetsService";

interface StatsViewProps {
  commissions: CommissionRecord[];
  commissionsLoading: boolean;
  currentView: "registration" | "dashboard" | "stats" | "network" | "personalData";
  onViewChange: (view: "registration" | "dashboard" | "stats" | "network" | "personalData") => void;
  onLogout?: () => void;
}

const StatsView = ({ commissions, commissionsLoading, currentView, onViewChange, onLogout }: StatsViewProps) => {
  const [selectedMonth, setSelectedMonth] = useState<string>("all");

  // Функция для парсинга даты из формата DD.MM.YYYY
  const parseDate = (dateString: string): Date | null => {
    if (!dateString) return null;
    
    // Проверяем формат DD.MM.YYYY
    const parts = dateString.split('.');
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1; // месяц в JavaScript начинается с 0
      const year = parseInt(parts[2], 10);
      
      if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
        return new Date(year, month, day);
      }
    }
    
    // Если не удалось распарсить в формате DD.MM.YYYY, пробуем стандартный парсинг
    const standardDate = new Date(dateString);
    return isNaN(standardDate.getTime()) ? null : standardDate;
  };

  const getAvailableMonths = () => {
    const months = new Set<string>();
    commissions.forEach(commission => {
      if (commission.date) {
        const date = parseDate(commission.date);
        if (date) {
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          months.add(monthKey);
        }
      }
    });
    return Array.from(months).sort().reverse();
  };

  const getFilteredCommissions = () => {
    if (selectedMonth === "all") {
      return commissions;
    }
    
    const [year, month] = selectedMonth.split('-');
    return commissions.filter(commission => {
      if (!commission.date) return false;
      const date = parseDate(commission.date);
      if (!date) return false;
      return date.getFullYear() === parseInt(year) && 
             date.getMonth() + 1 === parseInt(month);
    });
  };

  const filteredCommissions = getFilteredCommissions();
  const availableMonths = getAvailableMonths();

  const getTotalEarnings = () => {
    return filteredCommissions.reduce((sum, commission) => sum + (commission.amount || 0), 0);
  };

  const getCommissionsByLevel = () => {
    const levels = { 1: 0, 2: 0, 3: 0, 4: 0 };
    filteredCommissions.forEach(commission => {
      const level = commission.level || 1;
      if (levels[level as keyof typeof levels] !== undefined) {
        levels[level as keyof typeof levels] += commission.amount || 0;
      }
    });
    return levels;
  };

  const getMonthName = (monthKey: string) => {
    const [year, month] = monthKey.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('ru-RU', { 
      year: 'numeric', 
      month: 'long' 
    });
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Не указана';
    
    const date = parseDate(dateString);
    if (!date) return dateString; // Возвращаем исходную строку, если не удалось распарсить
    
    return date.toLocaleDateString('ru-RU');
  };

  const commissionsByLevel = getCommissionsByLevel();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Navigation currentView={currentView} onViewChange={onViewChange} onLogout={onLogout} />
      
      <div className="p-4 space-y-4">
        {/* Фильтр по месяцам */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Фильтр по периоду
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Выберите месяц" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все периоды</SelectItem>
                  {availableMonths.map(month => (
                    <SelectItem key={month} value={month}>
                      {getMonthName(month)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="text-sm text-gray-600">
                Найдено начислений: {filteredCommissions.length}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Сводка по выбранному периоду */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Сводка {selectedMonth === "all" ? "за все время" : `за ${getMonthName(selectedMonth)}`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                <p className="text-2xl font-bold text-green-600">
                  ₽{getTotalEarnings().toLocaleString('ru-RU')}
                </p>
                <p className="text-sm text-gray-600">Общий доход</p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-2xl font-bold text-blue-600">
                  {filteredCommissions.length}
                </p>
                <p className="text-sm text-gray-600">Начислений</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
                <p className="text-2xl font-bold text-purple-600">
                  ₽{filteredCommissions.length > 0 ? Math.round(getTotalEarnings() / filteredCommissions.length).toLocaleString('ru-RU') : 0}
                </p>
                <p className="text-sm text-gray-600">Среднее начисление</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Статистика по уровням */}
        <Card>
          <CardHeader>
            <CardTitle>Начисления по уровням</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(commissionsByLevel).map(([level, amount]) => (
                <div key={level} className="text-center p-3 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border">
                  <div className="text-xl font-bold text-gray-800">₽{amount.toLocaleString('ru-RU')}</div>
                  <div className="text-sm text-gray-600">Уровень {level}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Детальная таблица начислений */}
        <Card>
          <CardHeader>
            <CardTitle>Детализация начислений</CardTitle>
          </CardHeader>
          <CardContent>
            {commissionsLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-gray-600">Загрузка начислений...</p>
              </div>
            ) : filteredCommissions.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Дата</TableHead>
                      <TableHead>Сумма</TableHead>
                      <TableHead>Уровень</TableHead>
                      <TableHead>Процент</TableHead>
                      <TableHead>ID продажи</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCommissions.map((commission) => (
                      <TableRow key={commission.id}>
                        <TableCell>{formatDate(commission.date)}</TableCell>
                        <TableCell className="font-semibold text-green-600">
                          ₽{(commission.amount || 0).toLocaleString('ru-RU')}
                        </TableCell>
                        <TableCell>
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                            Уровень {commission.level || 1}
                          </span>
                        </TableCell>
                        <TableCell>{((commission.percentage || 0) * 100).toFixed(1)}%</TableCell>
                        <TableCell className="text-xs text-gray-500">{commission.saleId || 'N/A'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600">
                  {selectedMonth === "all" ? "Пока нет начислений" : "Нет начислений за выбранный период"}
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Начисления появятся после продаж по вашему промокоду
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StatsView;
