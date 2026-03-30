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
      main: "#2D3E59"
    },
    secondary: {
      main: "#991012"
    },
    text: {
      primary: "#18212f",
      secondary: "#5b6472"
    },
    background: {
      default: "#f3f5f8",
      paper: "#ffffff"
    },
    divider: "#d4dbe5"
  },
  shape: {
    borderRadius: 22
  },
  typography: {
    fontFamily: "\"Aptos\", \"Segoe UI\", \"Helvetica Neue\", sans-serif",
    body1: {
      lineHeight: 1.65
    },
    body2: {
      lineHeight: 1.6
    },
    h4: {
      fontWeight: 800,
      letterSpacing: -1
    },
    h5: {
      fontWeight: 800,
      letterSpacing: -0.7
    },
    h6: {
      fontWeight: 800,
      letterSpacing: -0.45
    },
    subtitle1: {
      fontWeight: 700
    }
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: "var(--shadow-soft)",
          border: "1px solid rgba(212, 219, 229, 0.95)",
          backgroundImage: "linear-gradient(180deg, rgba(255, 255, 255, 1) 0%, rgba(248, 250, 253, 1) 100%)"
        }
      }
    },
    MuiCardContent: {
      styleOverrides: {
        root: {
          padding: 28
        }
      }
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true
      },
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 700,
          borderRadius: 999
        },
        outlined: {
          borderColor: "rgba(45, 62, 89, 0.22)"
        }
      }
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 999,
          fontWeight: 600
        }
      }
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: "rgba(255, 255, 255, 0.92)",
          borderRadius: 18
        }
      }
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 16
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
