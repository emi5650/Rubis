import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { FormControl, FormLabel, Select } from "@chakra-ui/react";
export function CampaignSelector({ campaigns, campaignId, onChange }) {
    return (_jsxs(FormControl, { children: [_jsx(FormLabel, { fontSize: "sm", children: "Campagne" }), _jsx(Select, { value: campaignId, onChange: (event) => onChange(event.target.value), placeholder: campaigns.length === 0 ? "Aucune campagne disponible" : "Choisir une campagne...", children: campaigns.map((campaign) => (_jsx("option", { value: campaign.id, children: campaign.name }, campaign.id))) })] }));
}
