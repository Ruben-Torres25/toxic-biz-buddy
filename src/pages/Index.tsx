import { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { DashboardSection } from "@/components/dashboard/DashboardSection";
import { OrdersSection } from "@/components/sections/OrdersSection";
import { ClientsSection } from "@/components/sections/ClientsSection";
import { ProductsSection } from "@/components/sections/ProductsSection";
import { SuppliersSection } from "@/components/sections/SuppliersSection";
import { CashSection } from "@/components/sections/CashSection";
import { ReportsSection } from "@/components/sections/ReportsSection";
import { HistorySection } from "@/components/sections/HistorySection"; // 👈 NUEVO

const Index = () => {
  const [activeSection, setActiveSection] = useState("dashboard");

  const renderSection = () => {
    switch (activeSection) {
      case "dashboard":
        return <DashboardSection />;
      case "orders":
        return <OrdersSection />;
      case "clients":
        return <ClientsSection />;
      case "products":
        return <ProductsSection />;
      case "suppliers":
        return <SuppliersSection />;
      case "cash":
        return <CashSection />;
      case "reports":
        return <ReportsSection />;
      case "history": // 👈 NUEVO
        return <HistorySection />;
      default:
        return <DashboardSection />;
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar 
        activeSection={activeSection} 
        onSectionChange={setActiveSection} 
      />
      <main className="flex-1 p-8 overflow-auto">
        {renderSection()}
      </main>
    </div>
  );
};

export default Index;
