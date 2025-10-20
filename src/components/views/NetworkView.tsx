import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Navigation from "@/components/Navigation";
import { Phone, Mail, User } from "lucide-react";
import type { PartnerRecord } from "@/services/googleSheetsService";

interface NetworkViewProps {
  network: {
    level1: PartnerRecord[];
    level2: PartnerRecord[];
    level3: PartnerRecord[];
    level4: PartnerRecord[];
  };
  networkLoading: boolean;
  currentView: "registration" | "dashboard" | "stats" | "network" | "personalData";
  onViewChange: (view: "registration" | "dashboard" | "stats" | "network" | "personalData") => void;
  onLogout?: () => void;
}

const NetworkView = ({ network, networkLoading, currentView, onViewChange, onLogout }: NetworkViewProps) => {
  const renderPartnerCard = (partner: PartnerRecord) => (
    <div key={partner.id} className="bg-white p-3 rounded-lg border border-gray-200 space-y-2">
      <div className="flex items-center gap-2">
        <User className="w-4 h-4 text-gray-500" />
        <span className="font-medium">{partner.firstName} {partner.lastName}</span>
      </div>
      <div className="text-sm text-gray-600 space-y-1">
        <div className="flex items-center gap-2">
          <Phone className="w-3 h-3" />
          <span>{partner.phone}</span>
        </div>
        <div className="flex items-center gap-2">
          <Mail className="w-3 h-3" />
          <span>{partner.email}</span>
        </div>
        {partner.username && (
          <p>@{partner.username}</p>
        )}
        <p className="text-xs text-gray-500">
          Промокод: <code className="bg-gray-100 px-1 rounded">{partner.promoCode}</code>
        </p>
        <p className="text-xs text-gray-500">
          Доход: ₽{partner.totalEarnings.toLocaleString()}
        </p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Navigation currentView={currentView} onViewChange={onViewChange} onLogout={onLogout} />
      
      <div className="p-4 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Моя партнерская сеть</CardTitle>
          </CardHeader>
          <CardContent>
            {networkLoading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-gray-600">Загрузка...</p>
              </div>
            ) : (
              <div className="space-y-6">
                {[1, 2, 3, 4].map((level) => {
                  const levelData = network[`level${level}` as keyof typeof network];
                  const percentages = ['1%', '2%', '4%', '8%'];
                  return (
                    <div key={level} className="border rounded-lg p-4 bg-gray-50">
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="font-semibold text-lg">
                          Уровень {level} ({percentages[level - 1]})
                        </h3>
                        <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                          {levelData.length}
                        </span>
                      </div>
                      {levelData.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {levelData.map(renderPartnerCard)}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-center py-4">
                          Пока нет партнеров на этом уровне
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default NetworkView;
