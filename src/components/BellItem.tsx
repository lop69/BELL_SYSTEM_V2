import React from 'react';
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { MoreVertical, Trash2, Edit } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Bell } from "@/types/database";
import { cn } from "@/lib/utils";

const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface BellItemProps {
  bell: Bell;
  onEdit: (bell: Bell) => void;
  onDelete: (bellId: string) => void;
}

const BellItem = ({ bell, onEdit, onDelete }: BellItemProps) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: -50, scale: 0.95 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="flex items-center justify-between rounded-2xl border p-4 bg-background/50"
    >
      <div className="flex-grow">
        <div className="flex items-baseline gap-4">
          <p className="font-semibold text-lg">{bell.time}</p>
          <p className="text-sm text-muted-foreground">{bell.label}</p>
        </div>
        <div className="flex items-center gap-1.5 mt-2">
          {daysOfWeek.map((day, index) => (
            <span
              key={day}
              className={cn(
                "flex items-center justify-center h-5 w-5 rounded-full text-[10px] font-bold",
                bell.days_of_week.includes(index)
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {day.charAt(0)}
            </span>
          ))}
        </div>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => onEdit(bell)}>
            <Edit className="mr-2 h-4 w-4" /> Edit
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onDelete(bell.id)} className="text-red-500">
            <Trash2 className="mr-2 h-4 w-4" /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </motion.div>
  );
};

export default React.memo(BellItem);