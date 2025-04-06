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
  LogOut, 
  User, 
  Menu 
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";

type Tab = "dashboard" | "people" | "transactions" | "reports";

interface AppShellProps {
  children: React.ReactNode;
}

const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const [location] = useLocation();
  const [modalOpen, setModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout, isAuthenticated } = useAuth();

  console.log('AppShell: Current location:', location);
  
  // Check if we're on the login page
  const isLoginPage = location === '/login';
  
  if (isLoginPage) {
    console.log('AppShell: Rendering login page without navigation');
    return <>{children}</>;
  }

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
                <div className="flex items-center cursor-pointer">
                  <BarChart className="mr-2 h-5 w-5" />
                  <span className="font-medium text-xl">DebtTrack</span>
                </div>
              </Link>
            </div>
            <div className="hidden md:flex items-center">
              <span className="text-white text-sm mr-4">DebtTrack v1.0</span>
              {isAuthenticated && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative flex items-center gap-2 h-8 px-3 text-white">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>
                          {user?.displayName ? getInitials(user.displayName) : "U"}
                        </AvatarFallback>
                      </Avatar>
                      <span>{user?.displayName}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={logout} className="cursor-pointer">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
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
          <div className="flex overflow-x-auto border-b">
            <Link href="/">
              <div className={`px-6 py-4 cursor-pointer focus:outline-none border-b-2 -mb-[2px] font-medium ${
                activeTab === "dashboard" 
                  ? "border-primary text-primary" 
                  : "border-transparent text-neutral-400 hover:text-neutral-500"
              }`}>
                <HomeIcon className="inline-block mr-1 h-4 w-4" />
                Dashboard
              </div>
            </Link>
            <Link href="/people">
              <div className={`px-6 py-4 cursor-pointer focus:outline-none border-b-2 -mb-[2px] font-medium ${
                activeTab === "people" 
                  ? "border-primary text-primary" 
                  : "border-transparent text-neutral-400 hover:text-neutral-500"
              }`}>
                <Users className="inline-block mr-1 h-4 w-4" />
                People
              </div>
            </Link>
            <Link href="/transactions">
              <div className={`px-6 py-4 cursor-pointer focus:outline-none border-b-2 -mb-[2px] font-medium ${
                activeTab === "transactions" 
                  ? "border-primary text-primary" 
                  : "border-transparent text-neutral-400 hover:text-neutral-500"
              }`}>
                <Receipt className="inline-block mr-1 h-4 w-4" />
                Transactions
              </div>
            </Link>
            <Link href="/reports">
              <div className={`px-6 py-4 cursor-pointer focus:outline-none border-b-2 -mb-[2px] font-medium ${
                activeTab === "reports" 
                  ? "border-primary text-primary" 
                  : "border-transparent text-neutral-400 hover:text-neutral-500"
              }`}>
                <BarChart className="inline-block mr-1 h-4 w-4" />
                Reports
              </div>
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
