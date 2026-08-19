import { useState } from "react";
import { Info, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CharCount } from "@/components/form/CharCount";
import { FIELD_LIMITS } from "@/components/form/fieldLimits";
import { addCampaign, type FilterOption } from "@/services/createFormApi";

type AddCampaignModalProps = {
  open: boolean;
  market: string;
  existingCampaigns: FilterOption[];
  onOpenChange: (open: boolean) => void;
  onAdded: (campaign: FilterOption) => void;
};

export function AddCampaignModal({
  open,
  market,
  existingCampaigns,
  onOpenChange,
  onAdded,
}: AddCampaignModalProps) {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setName("");
      setError(null);
      setSaving(false);
    }
    onOpenChange(next);
  };

  const handleAdd = async () => {
    setSaving(true);
    setError(null);
    const result = await addCampaign(market, name, existingCampaigns);
    setSaving(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    onAdded(result.campaign);
    handleOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md gap-4 sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Campaign</DialogTitle>
        </DialogHeader>

        <div className="flex gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          <Info className="mt-0.5 size-4 shrink-0" />
          <p>
            Once you add campaign, it appears in the list in select campaign
            dropdown.
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="campaign-name">
              Campaign Name <span className="text-destructive">*</span>
            </Label>
            <CharCount value={name} max={FIELD_LIMITS.campaignName} />
          </div>
          <Input
            id="campaign-name"
            value={name}
            maxLength={FIELD_LIMITS.campaignName}
            onChange={(event) => setName(event.target.value)}
            placeholder="Enter campaign name to add"
            className="bg-white"
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            className="cursor-pointer rounded-full border-[#f0a8a0] text-[#e11d48] hover:bg-red-50 hover:text-[#e11d48]"
            onClick={() => handleOpenChange(false)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            type="button"
            className="cursor-pointer rounded-full"
            onClick={() => void handleAdd()}
            disabled={saving}
          >
            <Plus className="size-4" />
            Add Campaign
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
