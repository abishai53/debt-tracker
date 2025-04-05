import { useState } from "react";
import { Link, useLocation } from "wouter";
import AddNewModal from "./AddNewModal";
import { Button } from "@/components/ui/button";
import { 
  PlusIcon, 
  BarChart, 
  HomeIcon, 
  Users, 
  Receipt, 
  Moon, 
  Settings, 
  Menu 
} from "lucide-react";

type Tab = "dashboard" | "people" | "transactions" | "reports";

interface AppShellProps {
  children: React.ReactNode;
}

const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const [location, setLocation] = useLocation();
  const [modalOpen, setModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const getActiveTab = (): Tab => {
    if (location.startsWith("/people")) return "people";
    if (location.startsWith("/transactions")) return "transactions";
    if (location.startsWith("/reports")) return "reports";
    return "dashboard";
  };

  const activeTab = getActiveTab();

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* App Bar */}
      <header className="bg-primary text-white shadow-md">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link href="/">
                <a className="flex items-center">
                  <BarChart className="mr-2 h-5 w-5" />
                  <span className="font-medium text-xl">DebtTrack</span>
                </a>
              </Link>
            </div>
            <div className="hidden md:flex">
              <Button variant="ghost" size="icon" className="text-white">
                <Moon className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="text-white">
                <Settings className="h-5 w-5" />
              </Button>
            </div>
            <div className="md:hidden">
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-white"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                <Menu className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="bg-white shadow-sm">
        <div className="container mx-auto">
          <div className="flex overflow-x-auto">
            <Link href="/">
              <a className={`px-6 py-4 focus:outline-none border-b-2 font-medium ${
                activeTab === "dashboard" 
                  ? "border-primary text-primary" 
                  : "border-transparent text-neutral-400 hover:text-neutral-500"
              }`}>
                <HomeIcon className="inline-block mr-1 h-4 w-4" />
                Dashboard
              </a>
            </Link>
            <Link href="/people">
              <a className={`px-6 py-4 focus:outline-none border-b-2 font-medium ${
                activeTab === "people" 
                  ? "border-primary text-primary" 
                  : "border-transparent text-neutral-400 hover:text-neutral-500"
              }`}>
                <Users className="inline-block mr-1 h-4 w-4" />
                People
              </a>
            </Link>
            <Link href="/transactions">
              <a className={`px-6 py-4 focus:outline-none border-b-2 font-medium ${
                activeTab === "transactions" 
                  ? "border-primary text-primary" 
                  : "border-transparent text-neutral-400 hover:text-neutral-500"
              }`}>
                <Receipt className="inline-block mr-1 h-4 w-4" />
                Transactions
              </a>
            </Link>
            <Link href="/reports">
              <a className={`px-6 py-4 focus:outline-none border-b-2 font-medium ${
                activeTab === "reports" 
                  ? "border-primary text-primary" 
                  : "border-transparent text-neutral-400 hover:text-neutral-500"
              }`}>
                <BarChart className="inline-block mr-1 h-4 w-4" />
                Reports
              </a>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-grow container mx-auto px-4 py-6">
        {children}
      </main>

      {/* Floating Action Button */}
      <div className="fixed right-6 bottom-6 z-10">
        <Button 
          onClick={() => setModalOpen(true)}
          className="h-14 w-14 rounded-full bg-[#f50057] text-white hover:bg-opacity-90 shadow-lg"
        >
          <PlusIcon className="h-6 w-6" />
        </Button>
      </div>

      {/* Add New Modal */}
      <AddNewModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
};

export default AppShell;
