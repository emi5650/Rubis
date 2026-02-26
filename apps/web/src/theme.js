import { extendTheme } from "@chakra-ui/react";
const config = {
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
            50: "#e3f2ff",
            100: "#b3d4ff",
            200: "#81b5ff",
            300: "#4f95ff",
            400: "#1d76ff",
            500: "#045ce6",
            600: "#003db4",
            700: "#002182",
            800: "#000551",
            900: "#000020"
        }
    },
    components: {
        Button: {
            defaultProps: { colorScheme: "brand" }
        }
    }
});
export default theme;
