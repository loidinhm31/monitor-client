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
import { MoonIcon, SunIcon } from "@nextui-org/shared-icons";
import { Switch } from "@nextui-org/switch";
import { NextUIProvider } from "@nextui-org/system";
import React, { Suspense, useEffect, useState } from "react";
import { Route } from "react-router";

import Home from "@/pages/Home";

setupIonicReact();

const App = () => {
  const [theme, setTheme] = useState("dark");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === "light" ? "dark" : "light"));
  };

  return (
    <NextUIProvider>
      <IonApp>
        <IonMenu contentId="main-content">
          <IonHeader>
            <IonToolbar>
              <div className="p-1">
                <IonTitle>Menu Content</IonTitle>

                <Switch
                  className="p-3"
                  defaultSelected
                  size="lg"
                  onClick={toggleTheme}
                  thumbIcon={({ className }) =>
                    theme === "dark" ? <SunIcon className={className} /> : <MoonIcon className={className} />
                  }
                >
                  Dark mode
                </Switch>
              </div>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding">This is the menu content.</IonContent>
        </IonMenu>

        <IonReactRouter>
          <IonRouterOutlet id="main">
            <Suspense>
              <Route path="/" exact={true}>
                <Home />
              </Route>
            </Suspense>
          </IonRouterOutlet>
        </IonReactRouter>
      </IonApp>
    </NextUIProvider>
  );
};

export default App;
