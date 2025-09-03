import { Palette } from "lucide-react";
import { AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/ThemeToggle";

const AppearanceSettings = () => {
  return (
    <AccordionItem value="item-2">
      <AccordionTrigger>
        <div className="flex items-center gap-3"><Palette className="h-5 w-5" /> Appearance</div>
      </AccordionTrigger>
      <AccordionContent className="p-4 flex items-center justify-between">
        <Label htmlFor="theme-mode">Toggle Light/Dark Mode</Label>
        <ThemeToggle />
      </AccordionContent>
    </AccordionItem>
  );
};

export default AppearanceSettings;