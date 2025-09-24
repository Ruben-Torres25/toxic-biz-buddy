import { 
  Home, 
  ShoppingCart, 
  Users, 
  Package, 
  Truck, 
  Wallet,
  BarChart3
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

const menuItems = [
  { id: "dashboard", label: "Dashboard", icon: Home },
  { id: "orders", label: "Pedidos", icon: ShoppingCart },
  { id: "clients", label: "Clientes", icon: Users },
  { id: "products", label: "Productos", icon: Package },
  { id: "suppliers", label: "Proveedores", icon: Truck },
  { id: "cash", label: "Caja", icon: Wallet },
  { id: "reports", label: "Reportes", icon: BarChart3 },
];

export const Sidebar = ({ activeSection, onSectionChange }: SidebarProps) => {
  return (
    <div className="w-64 bg-card border-r border-border h-screen flex flex-col">
      <div className="p-6 border-b border-border">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          Toxic Business
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Sistema de Gestión</p>
      </div>
      
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.id}>
                <button
                  onClick={() => onSectionChange(item.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all duration-200",
                    "hover:bg-accent hover:text-accent-foreground",
                    activeSection === item.id 
                      ? "bg-primary text-primary-foreground shadow-md" 
                      : "text-foreground"
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
};
