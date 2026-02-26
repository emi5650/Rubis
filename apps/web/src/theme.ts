import { extendTheme, ThemeConfig } from "@chakra-ui/react";

const config: ThemeConfig = {
  initialColorMode: "light",
  useSystemColorMode: false
};

const theme = extendTheme({
  config,
  fonts: {
    heading: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    body: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  },
  colors: {
    brand: {
      50: "#ffe8ed",
      100: "#ffbfca",
      200: "#fe889f",
      300: "#f75d7d",
      400: "#ea3558",
      500: "#CF022B",
      600: "#b20024",
      700: "#8f001d",
      800: "#6b0016",
      900: "#47000f"
    },
    blue: {
      50: "#ffe8ed",
      100: "#ffbfca",
      200: "#fe889f",
      300: "#f75d7d",
      400: "#ea3558",
      500: "#CF022B",
      600: "#b20024",
      700: "#8f001d",
      800: "#6b0016",
      900: "#47000f"
    },
    orange: {
      50: "#fff1df",
      100: "#ffdcb6",
      200: "#ffcb93",
      300: "#ffb366",
      400: "#fa972f",
      500: "#F07D00",
      600: "#cd6a00",
      700: "#a95800",
      800: "#854600",
      900: "#613300"
    }
  },
  components: {
    Button: {
      defaultProps: { colorScheme: "brand" }
    }
  }
});

export default theme;
