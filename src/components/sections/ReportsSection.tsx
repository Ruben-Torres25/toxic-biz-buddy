import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart3, 
  Download, 
  Calendar,
  TrendingUp,
  DollarSign,
  Users,
  Package,
  ShoppingCart
} from "lucide-react";

export const ReportsSection = () => {
  const reportTypes = [
    {
      title: "Reporte de Ventas",
      description: "Análisis detallado de ventas por período",
      icon: DollarSign,
      period: "Último mes",
      value: "€12,450.75",
      trend: "+12.5%"
    },
    {
      title: "Reporte de Clientes", 
      description: "Estado de cuentas y actividad de clientes",
      icon: Users,
      period: "142 clientes",
      value: "€560.25",
      trend: "saldo total"
    },
    {
      title: "Reporte de Inventario",
      description: "Estado actual del stock y movimientos",
      icon: Package,
      period: "156 productos",
      value: "7 items",
      trend: "stock bajo"
    },
    {
      title: "Reporte de Pedidos",
      description: "Análisis de pedidos completados y pendientes",
      icon: ShoppingCart,
      period: "Último mes",
      value: "89 pedidos",
      trend: "+8.2%"
    }
  ];

  const quickStats = [
    { label: "Ventas Hoy", value: "€1,245.50", change: "+5.2%", positive: true },
    { label: "Pedidos Activos", value: "23", change: "+12", positive: true },
    { label: "Stock Crítico", value: "2", change: "-3", positive: true },
    { label: "Clientes Nuevos", value: "5", change: "+2", positive: true }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Reportes y Análisis</h1>
          <p className="text-muted-foreground">Genera reportes detallados del negocio</p>
        </div>
        <Button className="bg-gradient-to-r from-primary to-primary-hover hover:from-primary-hover hover:to-primary">
          <Download className="w-4 h-4 mr-2" />
          Exportar Todo
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {quickStats.map((stat, index) => (
          <Card key={index} className="bg-gradient-to-br from-card to-accent/5">
            <CardContent className="pt-6">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <Badge className={`${
                  stat.positive 
                    ? 'bg-success/10 text-success border-success/20' 
                    : 'bg-destructive/10 text-destructive border-destructive/20'
                }`}>
                  {stat.change}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Report Types */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reportTypes.map((report, index) => {
          const Icon = report.icon;
          return (
            <Card key={index} className="hover:shadow-lg transition-all duration-200 cursor-pointer border-border hover:border-primary/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">{report.title}</h3>
                    <p className="text-sm text-muted-foreground">{report.description}</p>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{report.period}</p>
                    <p className="text-xl font-bold text-foreground">{report.value}</p>
                    <p className="text-sm text-muted-foreground">{report.trend}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      <BarChart3 className="w-4 h-4 mr-2" />
                      Ver
                    </Button>
                    <Button size="sm" className="bg-gradient-to-r from-secondary to-secondary-hover">
                      <Download className="w-4 h-4 mr-2" />
                      Exportar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Chart Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Vista Previa - Ventas de los Últimos 7 Días
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 bg-gradient-to-br from-accent/30 to-accent/10 rounded-lg flex items-center justify-center border border-border">
            <div className="text-center space-y-2">
              <BarChart3 className="w-16 h-16 text-muted-foreground mx-auto" />
              <p className="text-muted-foreground">Gráfico de ventas se mostraría aquí</p>
              <p className="text-sm text-muted-foreground">Integración con biblioteca de gráficos pendiente</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Export Options */}
      <Card>
        <CardHeader>
          <CardTitle>Opciones de Exportación</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="h-auto p-4">
              <div className="text-center">
                <Calendar className="w-8 h-8 mx-auto mb-2 text-primary" />
                <p className="font-medium">Reporte Diario</p>
                <p className="text-sm text-muted-foreground">Exportar datos de hoy</p>
              </div>
            </Button>
            <Button variant="outline" className="h-auto p-4">
              <div className="text-center">
                <Calendar className="w-8 h-8 mx-auto mb-2 text-secondary" />
                <p className="font-medium">Reporte Semanal</p>
                <p className="text-sm text-muted-foreground">Últimos 7 días</p>
              </div>
            </Button>
            <Button variant="outline" className="h-auto p-4">
              <div className="text-center">
                <Calendar className="w-8 h-8 mx-auto mb-2 text-warning" />
                <p className="font-medium">Reporte Mensual</p>
                <p className="text-sm text-muted-foreground">Último mes completo</p>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
