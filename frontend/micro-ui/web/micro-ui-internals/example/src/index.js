import React, { useEffect, useState, lazy, Suspense } from "react";
import ReactDOM from "react-dom/client";
import { Hooks } from "@egovernments/digit-ui-libraries";
import { PGRReducers } from "@egovernments/digit-ui-module-ccrs";
import { initLibraries } from "@egovernments/digit-ui-libraries";
import "@egovernments/digit-ui-health-css/example/index.css";
import { Loader } from "@egovernments/digit-ui-components";

import { UICustomizations } from "./UICustomizations";
import { pgrCustomizations, pgrComponents } from "./pgr";

window.Digit = window.Digit || {};
window.Digit.Hooks = Hooks;

// Initialize globalConfigs if not loaded from external script
if (!window.globalConfigs) {
  window.globalConfigs = {
    getConfig: (key) => {
      const configs = {
        "CONTEXT_PATH": "digit-ui",
        "STATE_LEVEL_TENANT_ID": "pb",
        "LOCALE": "en_IN",
      };
      return configs[key];
    }
  };
}

const DigitUILazy = lazy(() => import("@egovernments/digit-ui-module-core").then((module) => ({ default: module.DigitUI })));

const enabledModules = ["Utilities", "PGR"];

const initTokens = (stateCode) => {
  const userType = window.sessionStorage.getItem("userType") || process.env.REACT_APP_USER_TYPE || "CITIZEN";
  const token = window.localStorage.getItem("token") || process.env[`REACT_APP_${userType}_TOKEN`];

  const citizenInfo = window.localStorage.getItem("Citizen.user-info");
  const citizenTenantId = window.localStorage.getItem("Citizen.tenant-id") || stateCode;
  const employeeInfo = window.localStorage.getItem("Employee.user-info");
  const employeeTenantId = window.localStorage.getItem("Employee.tenant-id");

  const userTypeInfo = userType === "CITIZEN" || userType === "QACT" ? "citizen" : "employee";
  window.Digit.SessionStorage.set("user_type", userTypeInfo);
  window.Digit.SessionStorage.set("userType", userTypeInfo);

  if (userType !== "CITIZEN") {
    window.Digit.SessionStorage.set("User", {
      access_token: token,
      info: userType !== "CITIZEN" ? JSON.parse(employeeInfo) : citizenInfo,
    });
  }

  window.Digit.SessionStorage.set("Citizen.tenantId", citizenTenantId);

  if (employeeTenantId && employeeTenantId.length) {
    window.Digit.SessionStorage.set("Employee.tenantId", employeeTenantId);
  }
};

const waitForGlobalConfigs = () => {
  return new Promise((resolve) => {
    if (window.globalConfigs) {
      resolve();
    } else {
      const checkInterval = setInterval(() => {
        if (window.globalConfigs) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);
      
      // Timeout after 5 seconds and resolve anyway
      setTimeout(() => {
        clearInterval(checkInterval);
        console.warn("Global configs not loaded, using defaults");
        resolve();
      }, 5000);
    }
  });
};

const initDigitUI = async () => {
  // Wait for global configs to load
  await waitForGlobalConfigs();
  
  window.contextPath = window?.globalConfigs?.getConfig("CONTEXT_PATH") || "digit-ui";

  window.Digit.Customizations = {
    commonUiConfig: UICustomizations,
    PGR: pgrCustomizations,
  };
  
  // Setup component registry if available
  if (window?.Digit?.ComponentRegistryService?.setupRegistry) {
    window.Digit.ComponentRegistryService.setupRegistry({
      ...pgrComponents,
    });
  }

  const stateCode = window?.globalConfigs?.getConfig("STATE_LEVEL_TENANT_ID") || "pb";
  const root = ReactDOM.createRoot(document.getElementById("root"));
  root.render(<MainApp stateCode={stateCode} enabledModules={enabledModules} />);
};

const MainApp = ({ stateCode, enabledModules }) => {
  const [isReady, setIsReady] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    initLibraries().then(async () => {
      const [
        { initUtilitiesComponents },
        { initPGRComponents },
      ] = await Promise.all([
        import("@egovernments/digit-ui-module-utilities"),
        import("@egovernments/digit-ui-module-ccrs"),
      ]);

      initUtilitiesComponents();
      initPGRComponents();

      // Workbench and HRMS modules disabled due to dependency issues
      // try {
      //   const { initWorkbenchComponents } = await import("@egovernments/digit-ui-module-workbench");
      //   initWorkbenchComponents();
      // } catch (e) {
      //   console.warn("Workbench module not available:", e);
      // }

      // HRMS module disabled due to dependency issues
      // try {
      //   const { initHRMSComponents } = await import("@egovernments/digit-ui-module-hrms");
      //   initHRMSComponents();
      // } catch (e) {
      //   console.warn("HRMS module not available:", e);
      // }

      setIsReady(true);
    });
  }, []);

  useEffect(() => {
    if (isReady) {
      initTokens(stateCode);
      setLoaded(true);
    }
  }, [stateCode, isReady]);

  if (!loaded) {
    return <div>Loading...</div>;
  }

  const moduleReducers = (initData) => ({
    pgr: PGRReducers(initData),
  });

  return (
    <Suspense fallback={<Loader page={true} variant={"PageLoader"} />}>
      {window.Digit && (
        <DigitUILazy
          stateCode={stateCode}
          enabledModules={enabledModules}
          allowedUserTypes={["employee", "citizen"]}
          defaultLanding="employee"
          moduleReducers={moduleReducers}
        />
      )}
    </Suspense>
  );
};

initDigitUI();
