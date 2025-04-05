import { Link } from "wouter";
import { type PersonBalance } from "@shared/schema";
import { AvatarName } from "@/components/ui/avatar-name";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface PersonItemProps {
  personBalance: PersonBalance;
  type: "debtor" | "creditor";
}

const PersonItem: React.FC<PersonItemProps> = ({ personBalance, type }) => {
  const { person, balance, lastTransaction } = personBalance;
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(Math.abs(value));
  };
  
  const formatDate = (date: Date | null) => {
    if (!date) return "No transactions";
    return `Last transaction: ${format(new Date(date), "MMMM d")}`;
  };

  // For debtors, balance is positive (they owe you)
  // For creditors, balance is negative (you owe them)
  const isPositiveBalance = type === "debtor";
  
  return (
    <li className="border-b last:border-b-0">
      <div className="p-4 flex justify-between items-center">
        <div className="flex items-center">
          <AvatarName name={person.name} className="mr-3" />
          <div>
            <p className="font-medium">{person.name}</p>
            <p className="text-neutral-300 text-sm">
              {formatDate(lastTransaction)}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className={cn(
            "font-mono font-medium",
            isPositiveBalance ? "text-positive" : "text-negative"
          )}>
            {formatCurrency(Math.abs(balance))}
          </p>
          <Link href={`/people/${person.id}`}>
            <a className="text-primary text-sm hover:underline">Details</a>
          </Link>
        </div>
      </div>
    </li>
  );
};

export default PersonItem;
