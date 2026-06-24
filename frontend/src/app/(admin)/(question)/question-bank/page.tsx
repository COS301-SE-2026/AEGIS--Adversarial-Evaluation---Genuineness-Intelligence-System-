"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import AdminSidebar from "@/components/admin/layouts/sidebar";
import AdminTopbar from "@/components/admin/layouts/topbar";
import QuestionFilters from "@/components/admin/ui/input/question-filter";
import { Plus, Menu, X} from "lucide-react"
import { Mock_Questions } from "../../types/questions"
import { Question_Categories } from "../../types/questions";

export default function ViewQuestionsPage() {

  return (
    <div>
      <AdminSidebar/>
      {/* <QuestionFilters/> */}
    </div>
  );
}
