import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Calendar,
  Download,
  Wallet,
  CreditCard,
  Banknote
} from "lucide-react";

export const CashSection = () => {
  const cashData = {
    openingBalance: 500.00,
    currentBalance: 1245.50,
    totalSales: 2150.75,
    totalExpenses: 405.25,
    isOpen: true,
    openedAt: "08:30 AM",
    lastTransaction: "14:30 PM"
  };

  const transactions = [
    {
      id: "TXN001",
      type: "sale",
      description: "Venta - Pedido #PED001",
      amount: 450.00,
      time: "14:30",
      method: "efectivo"
    },
    {
      id: "TXN002", 
      type: "sale",
      description: "Venta - Pedido #PED002",
      amount: 230.50,
      time: "13:15",
      method: "tarjeta"
    },
    {
      id: "TXN003",
      type: "expense", 
      description: "Compra suministros oficina",
      amount: -45.25,
      time: "12:00",
      method: "efectivo"
    },
    {
      id: "TXN004",
      type: "sale",
      description: "Venta - Pedido #PED003",
      amount: 680.00,
      time: "11:45",
      method: "transferencia"
    }
  ];

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "sale":
        return <TrendingUp className="w-4 h-4 text-success" />;
      case "expense":
        return <TrendingDown className="w-4 h-4 text-destructive" />;
      default:
        return <DollarSign className="w-4 h-4" />;
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case "efectivo":
        return <Banknote className="w-3 h-3" />;
      case "tarjeta":
        return <CreditCard className="w-3 h-3" />;
      case "transferencia":
        return <Wallet className="w-3 h-3" />;
      default:
        return <DollarSign className="w-3 h-3" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestión de Caja</h1>
          <p className="text-muted-foreground">Control diario de ingresos y gastos</p>
        </div>
        <div className="flex gap-3">
          {cashData.isOpen ? (
            <Button variant="outline" className="bg-gradient-to-r from-destructive/10 to-destructive/20 border-destructive/30 text-destructive">
              <Wallet className="w-4 h-4 mr-2" />
              Cerrar Caja
            </Button>
          ) : (
            <Button className="bg-gradient-to-r from-success to-success-hover">
              <Wallet className="w-4 h-4 mr-2" />
              Abrir Caja
            </Button>
          )}
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Generar Reporte
          </Button>
        </div>
      </div>

      {/* Cash Status */}
      <Card className={`border-2 ${cashData.isOpen ? 'border-success/30 bg-gradient-to-br from-success/5 to-success/10' : 'border-muted/30'}`}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                cashData.isOpen ? 'bg-success/20' : 'bg-muted/20'
              }`}>
                <Wallet className={`w-8 h-8 ${cashData.isOpen ? 'text-success' : 'text-muted-foreground'}`} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">
                  Caja {cashData.isOpen ? 'Abierta' : 'Cerrada'}
                </h2>
                <p className="text-muted-foreground">
                  {cashData.isOpen ? `Abierta desde ${cashData.openedAt}` : 'Caja cerrada'}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Saldo Actual</p>
              <p className="text-3xl font-bold text-foreground">€{cashData.currentBalance.toFixed(2)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-card to-accent/5">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Saldo Inicial</p>
                <p className="text-2xl font-bold text-foreground">€{cashData.openingBalance.toFixed(2)}</p>
              </div>
              <Wallet className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-success/5 to-success/10 border-success/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Ventas</p>
                <p className="text-2xl font-bold text-success">€{cashData.totalSales.toFixed(2)}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-success" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-destructive/5 to-destructive/10 border-destructive/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Gastos</p>
                <p className="text-2xl font-bold text-destructive">€{cashData.totalExpenses.toFixed(2)}</p>
              </div>
              <TrendingDown className="w-8 h-8 text-destructive" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Beneficio Neto</p>
                <p className="text-2xl font-bold text-primary">
                  €{(cashData.totalSales - cashData.totalExpenses).toFixed(2)}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transactions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Movimientos de Hoy
            </span>
            <Badge className="bg-primary/10 text-primary border-primary/20">
              {transactions.length} transacciones
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {transactions.map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between p-4 rounded-lg bg-accent/30 hover:bg-accent/50 transition-colors">
                <div className="flex items-center gap-3">
                  {getTransactionIcon(transaction.type)}
                  <div>
                    <p className="font-medium text-foreground">{transaction.description}</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      {getPaymentMethodIcon(transaction.method)}
                      {transaction.method} • {transaction.time}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-lg font-bold ${
                    transaction.amount > 0 ? 'text-success' : 'text-destructive'
                  }`}>
                    {transaction.amount > 0 ? '+' : ''}€{Math.abs(transaction.amount).toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
