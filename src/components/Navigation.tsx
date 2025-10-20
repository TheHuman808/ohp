
import { Button } from "@/components/ui/button";
import { Users, FileText, LogOut } from "lucide-react";

interface NavigationProps {
  currentView: "registration" | "dashboard" | "stats" | "network" | "personalData";
  onViewChange: (view: "registration" | "dashboard" | "stats" | "network" | "personalData") => void;
  onLogout?: () => void;
}

const Navigation = ({ currentView, onViewChange, onLogout }: NavigationProps) => {
  return (
    <div className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="overflow-x-auto">
        <div className="flex min-w-max py-3 px-2 gap-2">
          <Button
            variant={currentView === "dashboard" ? "default" : "ghost"}
            onClick={() => onViewChange("dashboard")}
            className="flex-shrink-0 px-4"
          >
            Главная
          </Button>
          <Button
            variant={currentView === "stats" ? "default" : "ghost"}
            onClick={() => onViewChange("stats")}
            className="flex-shrink-0 px-4"
          >
            <FileText className="w-4 h-4 mr-1" />
            Статистика
          </Button>
          <Button
            variant={currentView === "network" ? "default" : "ghost"}
            onClick={() => onViewChange("network")}
            className="flex-shrink-0 px-4"
          >
            <Users className="w-4 h-4 mr-1" />
            Сеть
          </Button>
          {onLogout && (
            <Button
              variant="outline"
              onClick={onLogout}
              className="flex-shrink-0 px-4 text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <LogOut className="w-4 h-4 mr-1" />
              Выйти
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Navigation;
