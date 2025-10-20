import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Navigation from "@/components/Navigation";
import { Users, TrendingUp, Share2 } from "lucide-react";
import type { PartnerRecord, CommissionRecord } from "@/services/googleSheetsService";

interface DashboardViewProps {
  partner: PartnerRecord;
  commissions: CommissionRecord[];
  currentView: "registration" | "dashboard" | "stats" | "network" | "personalData";
  onViewChange: (view: "registration" | "dashboard" | "stats" | "network" | "personalData") => void;
  onLogout?: () => void;
}

const DashboardView = ({ partner, commissions, currentView, onViewChange, onLogout }: DashboardViewProps) => {
  const totalCommissions = commissions.reduce((sum, comm) => sum + comm.amount, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Navigation currentView={currentView} onViewChange={onViewChange} onLogout={onLogout} />
      
      <div className="p-4 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Добро пожаловать, {partner.firstName}!</span>
              <Badge variant="secondary">{partner.promoCode}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-3 p-3 bg-white rounded-lg shadow-sm">
                <TrendingUp className="w-8 h-8 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Общий доход</p>
                  <p className="text-xl font-bold">₽{totalCommissions.toLocaleString()}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 bg-white rounded-lg shadow-sm">
                <Users className="w-8 h-8 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Партнеры</p>
                  <p className="text-xl font-bold">0</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 bg-white rounded-lg shadow-sm">
                <Share2 className="w-8 h-8 text-purple-600" />
                <div>
                  <p className="text-sm text-gray-600">Продажи</p>
                  <p className="text-xl font-bold">{partner.salesCount}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Информация о партнере</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <strong>Имя:</strong> {partner.firstName} {partner.lastName}
              </div>
              <div>
                <strong>Телефон:</strong> {partner.phone}
              </div>
              <div>
                <strong>Email:</strong> {partner.email}
              </div>
              <div>
                <strong>Username:</strong> {partner.username || 'не указан'}
              </div>
              <div>
                <strong>Промокод:</strong> <code className="bg-gray-100 px-2 py-1 rounded">{partner.promoCode}</code>
              </div>
              <div>
                <strong>Дата регистрации:</strong> {partner.registrationDate}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Условия партнерской программы</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="p-3 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg">
                <div className="text-2xl font-bold text-blue-800">1%</div>
                <div className="text-sm text-blue-700">Уровень 1</div>
              </div>
              <div className="p-3 bg-gradient-to-br from-green-100 to-green-200 rounded-lg">
                <div className="text-2xl font-bold text-green-800">2%</div>
                <div className="text-sm text-green-700">Уровень 2</div>
              </div>
              <div className="p-3 bg-gradient-to-br from-orange-100 to-orange-200 rounded-lg">
                <div className="text-2xl font-bold text-orange-800">4%</div>
                <div className="text-sm text-orange-700">Уровень 3</div>
              </div>
              <div className="p-3 bg-gradient-to-br from-purple-100 to-purple-200 rounded-lg">
                <div className="text-2xl font-bold text-purple-800">8%</div>
                <div className="text-sm text-purple-700">Уровень 4</div>
              </div>
            </div>
            <p className="text-sm text-gray-600 mt-4 text-center">
              Процент с продаж привлеченных партнеров на соответствующем уровне
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardView;
