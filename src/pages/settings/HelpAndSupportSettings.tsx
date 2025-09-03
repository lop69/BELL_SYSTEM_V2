import { LifeBuoy } from "lucide-react";
import { AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const HelpAndSupportSettings = () => {
  const navigate = useNavigate();
  return (
    <AccordionItem value="item-4">
      <AccordionTrigger>
        <div className="flex items-center gap-3"><LifeBuoy className="h-5 w-5" /> Help & Support</div>
      </AccordionTrigger>
      <AccordionContent className="p-4 space-y-2">
        <Button variant="link" className="p-0 h-auto" onClick={() => navigate('/app/support')}>Contact Support</Button>
        <Button variant="link" className="p-0 h-auto" onClick={() => navigate('/app/support')}>FAQs</Button>
      </AccordionContent>
    </AccordionItem>
  );
};

export default HelpAndSupportSettings;