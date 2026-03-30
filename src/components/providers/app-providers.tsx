"use client";

import { createTheme, CssBaseline, ThemeProvider } from "@mui/material";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

type AppProvidersProperties = Readonly<{
  children: React.ReactNode;
}>;

const applicationTheme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#0b7285"
    },
    secondary: {
      main: "#106ba3"
    },
    background: {
      default: "#f4f6fb",
      paper: "#ffffff"
    }
  },
  shape: {
    borderRadius: 18
  },
  typography: {
    fontFamily: "Arial, Helvetica, sans-serif",
    body1: {
      lineHeight: 1.6
    },
    body2: {
      lineHeight: 1.55
    },
    h4: {
      fontWeight: 800
    },
    h5: {
      fontWeight: 800
    },
    h6: {
      fontWeight: 800
    }
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: "0 16px 40px rgba(24, 33, 47, 0.08)",
          border: "1px solid rgba(213, 222, 236, 0.9)"
        }
      }
    },
    MuiCardContent: {
      styleOverrides: {
        root: {
          padding: 24
        }
      }
    }
  }
});

export function AppProviders({ children }: AppProvidersProperties) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60_000,
            refetchOnWindowFocus: false
          }
        }
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={applicationTheme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </QueryClientProvider>
  );
}
