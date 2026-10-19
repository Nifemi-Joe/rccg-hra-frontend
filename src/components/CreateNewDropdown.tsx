import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Plus, UserPlus, Users, Home, Star } from "lucide-react";
import { CreateMemberModal } from "@/components/modals/CreateMemberModal";
import { CreateFamilyModal } from "@/components/modals/CreateFamilyModal";
import { CreateGroupModal } from "@/components/modals/CreateGroupModal";
import { FirstTimerModal } from "@/components/modals/FirstTimerModal";

export function CreateNewDropdown() {
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [showFamilyModal, setShowFamilyModal] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showFirstTimerModal, setShowFirstTimerModal] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button className="bg-gradient-primary text-white hover:opacity-90 gap-2">
            <Plus className="h-4 w-4" />
            Create New
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48 bg-background z-50">
          <DropdownMenuItem onClick={() => setShowMemberModal(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            New Member
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setShowFirstTimerModal(true)}>
            <Star className="mr-2 h-4 w-4" />
            First Timer
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setShowFamilyModal(true)}>
            <Home className="mr-2 h-4 w-4" />
            New Family
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setShowGroupModal(true)}>
            <Users className="mr-2 h-4 w-4" />
            New Group
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <CreateMemberModal
        open={showMemberModal}
        onClose={() => setShowMemberModal(false)}
      />
      <CreateFamilyModal
        open={showFamilyModal}
        onClose={() => setShowFamilyModal(false)}
      />
      <CreateGroupModal
        open={showGroupModal}
        onClose={() => setShowGroupModal(false)}
      />
      <FirstTimerModal
        open={showFirstTimerModal}
        onClose={() => setShowFirstTimerModal(false)}
      />
    </>
  );
}
