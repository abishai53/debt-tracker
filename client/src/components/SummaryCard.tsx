import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, BarChart } from "lucide-react";
import { cn } from "@/lib/utils";

interface SummaryCardProps {
  title: string;
  amount: number;
  type: "owed" | "owing" | "balance";
  subtitle?: string;
}

const SummaryCard: React.FC<SummaryCardProps> = ({ 
  title, 
  amount, 
  type, 
  subtitle 
}) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  const getIcon = () => {
    switch (type) {
      case "owed":
        return <TrendingUp className="text-positive h-5 w-5" />;
      case "owing":
        return <TrendingDown className="text-negative h-5 w-5" />;
      case "balance":
        return <BarChart className="text-positive h-5 w-5" />;
    }
  };

  const getAmountColor = () => {
    switch (type) {
      case "owed":
        return "text-positive";
      case "owing":
        return "text-negative";
      case "balance":
        return amount >= 0 ? "text-positive" : "text-negative";
    }
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-medium text-lg text-neutral-500">{title}</h3>
          {getIcon()}
        </div>
        <p className={cn("font-mono text-2xl font-medium", getAmountColor())}>
          {formatCurrency(amount)}
        </p>
        {subtitle && <p className="text-neutral-300 text-sm mt-1">{subtitle}</p>}
      </CardContent>
    </Card>
  );
};

export default SummaryCard;
