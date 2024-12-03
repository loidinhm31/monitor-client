/* Core CSS required for Ionic components to work properly */
import "@ionic/react/css/core.css";
/* Basic CSS for apps built with Ionic */
import "@ionic/react/css/normalize.css";
import "@ionic/react/css/structure.css";
import "@ionic/react/css/typography.css";
/* Optional CSS utils that can be commented out */
import "@ionic/react/css/padding.css";
import "@ionic/react/css/float-elements.css";
import "@ionic/react/css/text-alignment.css";
import "@ionic/react/css/text-transformation.css";
import "@ionic/react/css/flex-utils.css";
import "@ionic/react/css/display.css";
/* Theme variables */
import "@/theme/variables.scss";

import {
  IonApp,
  IonContent,
  IonHeader,
  IonMenu,
  IonRouterOutlet,
  IonTitle,
  IonToolbar,
  setupIonicReact,
} from "@ionic/react";
import { IonReactRouter } from "@ionic/react-router";
import { Button } from "@nextui-org/button";
import { Card } from "@nextui-org/card";
import { MoonIcon, SunIcon } from "@nextui-org/shared-icons";
import { Switch } from "@nextui-org/switch";
import { NextUIProvider } from "@nextui-org/system";
import {
  BarChart as ChartIcon,
  FileText as DocumentIcon,
  HomeIcon,
  LogOut as LogOutIcon,
  Settings as GearIcon,
  UserIcon,
} from "lucide-react";
import React, { Suspense, useEffect, useState } from "react";
import { Route } from "react-router";

import Analytics from "@/pages/Analytics";
import Home from "@/pages/Home";

setupIonicReact();

interface MenuItemProps {
  icon: React.ReactNode;
  title: string;
  path: string;
  onClick?: () => void;
}

const MenuItem: React.FC<MenuItemProps> = ({ icon, title, path, onClick }) => {
  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      window.location.href = path;
    }
  };

  return (
    <Button variant="light" startContent={icon} className="w-full justify-start py-6" onClick={handleClick}>
      {title}
    </Button>
  );
};

const App = () => {
  const [theme, setTheme] = useState("dark");

  const menuItems: MenuItemProps[] = [
    {
      icon: <HomeIcon className="w-5 h-5" />,
      title: "Home",
      path: "/",
    },
    {
      icon: <UserIcon className="w-5 h-5" />,
      title: "Profile",
      path: "/profile",
    },
    {
      icon: <ChartIcon className="w-5 h-5" />,
      title: "Analytics",
      path: "/analytics",
    },
    {
      icon: <DocumentIcon className="w-5 h-5" />,
      title: "Documents",
      path: "/documents",
    },
    {
      icon: <GearIcon className="w-5 h-5" />,
      title: "Settings",
      path: "/settings",
    },
  ];

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === "light" ? "dark" : "light"));
  };

  const handleLogout = () => {
    console.log("Logging out...");
  };

  return (
    <NextUIProvider>
      <IonApp>
        <IonMenu contentId="main-content">
          <IonHeader>
            <IonToolbar>
              <div className="p-4 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <IonTitle>Menu</IonTitle>
                  <Switch
                    defaultSelected
                    size="lg"
                    onClick={toggleTheme}
                    thumbIcon={({ className }) =>
                      theme === "dark" ? <SunIcon className={className} /> : <MoonIcon className={className} />
                    }
                  />
                </div>

                <Card className="p-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary-500 flex items-center justify-center">
                      <UserIcon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">John Doe</p>
                      <p className="text-xs text-default-500">john.doe@example.com</p>
                    </div>
                  </div>
                </Card>
              </div>
            </IonToolbar>
          </IonHeader>

          <IonContent>
            <div className="flex flex-col p-2">
              {menuItems.map((item) => (
                <MenuItem key={item.path} icon={item.icon} title={item.title} path={item.path} />
              ))}
            </div>

            <div className="absolute bottom-0 w-full p-4">
              <Button
                color="danger"
                variant="flat"
                className="w-full"
                startContent={<LogOutIcon className="w-4 h-4" />}
                onClick={handleLogout}
              >
                Logout
              </Button>
            </div>
          </IonContent>
        </IonMenu>

        <IonReactRouter>
          <IonRouterOutlet id="main">
            <Suspense>
              <Route path="/" exact={true} component={Home} />
              <Route path="/analytics" exact={true} component={Analytics} />
            </Suspense>
          </IonRouterOutlet>
        </IonReactRouter>
      </IonApp>
    </NextUIProvider>
  );
};

export default App;
