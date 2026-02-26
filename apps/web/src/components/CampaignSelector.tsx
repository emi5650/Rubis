import { FormControl, FormLabel, Select } from "@chakra-ui/react";
import { Campaign } from "../api/rubis";

type CampaignSelectorProps = {
  campaigns: Campaign[];
  campaignId: string;
  onChange: (value: string) => void;
};

export function CampaignSelector({ campaigns, campaignId, onChange }: CampaignSelectorProps) {
  return (
    <FormControl>
      <FormLabel fontSize="sm">Campagne</FormLabel>
      <Select 
        value={campaignId} 
        onChange={(event) => onChange(event.target.value)} 
        placeholder={campaigns.length === 0 ? "Aucune campagne disponible" : "Choisir une campagne..."}
      >
        {campaigns.map((campaign) => (
          <option key={campaign.id} value={campaign.id}>
            {campaign.name}
          </option>
        ))}
      </Select>
    </FormControl>
  );
}
